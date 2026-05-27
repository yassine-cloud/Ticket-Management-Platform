import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { RegisterDto } from './dto/register.dto';
import type { Prisma, Session } from '../../generated/prisma/client';

export type AuthRequestContext = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, context?: AuthRequestContext) {
    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = this.verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshTokenId = randomUUID();

    // Try to reuse an existing non-revoked session for this user + IP (same device)
    let existingSession: Session | null = null;
    if (context?.ip) {
      existingSession = await this.databaseService.session.findFirst({
        where: {
          userId: user.id,
          ip: context.ip,
          revokedAt: null,
        },
      });
    }

    if (existingSession) {
      const deviceInfoForDb = context?.userAgent
        ? ({ userAgent: context.userAgent } as unknown as Prisma.InputJsonValue)
        : ((existingSession.deviceInfo ?? undefined) as unknown as
            | Prisma.InputJsonValue
            | Prisma.NullableJsonNullValueInput);

      await this.databaseService.session.update({
        where: { id: existingSession.id },
        data: {
          refreshTokenId,
          ip: context?.ip ?? existingSession.ip,
          deviceInfo: deviceInfoForDb,
        },
      });
    } else {
      const deviceInfoForDb = context?.userAgent
        ? ({ userAgent: context.userAgent } as unknown as Prisma.InputJsonValue)
        : undefined;

      await this.databaseService.session.create({
        data: {
          userId: user.id,
          refreshTokenId,
          ip: context?.ip ?? null,
          deviceInfo: deviceInfoForDb,
        },
      });
    }

    const tokens = this.issueTokens(user.id, refreshTokenId);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    };
  }

  async register(dto: RegisterDto, context?: AuthRequestContext) {
    const email = dto.email.toLowerCase();
    const username = dto.username.toLowerCase();
    const existing = await this.databaseService.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing != null) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = this.hashPassword(dto.password);

    try {
      const user = await this.databaseService.user.create({
        data: {
          email,
          username,
          displayName: dto.displayName,
          passwordHash,
        },
      });

      this.sendEmailVerificationEmail(email, 'dummy-token');
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new UnauthorizedException('User already exists');
      }
      throw error;
    }
  }

  async refresh(dto: RefreshTokenDto, context?: AuthRequestContext) {
    const payload = this.verifyRefreshToken(dto.refreshToken);

    const session = await this.databaseService.session.findUnique({
      where: { refreshTokenId: payload.jti },
    });

    if (!session || session.revokedAt || session.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Instead of creating a new DB row for rotation, update the existing session's token id.
    const newRefreshTokenId = randomUUID();
    const deviceInfoForDb = context?.userAgent
      ? ({ userAgent: context.userAgent } as unknown as Prisma.InputJsonValue)
      : ((session.deviceInfo ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput);

    await this.databaseService.session.update({
      where: { id: session.id },
      data: {
        refreshTokenId: newRefreshTokenId,
        ip: context?.ip ?? session.ip,
        deviceInfo: deviceInfoForDb,
      },
    });

    return this.issueTokens(session.userId, newRefreshTokenId);
  }

  async logout(dto: LogoutDto) {
    const payload = this.verifyRefreshToken(dto.refreshToken);

    const session = await this.databaseService.session.findUnique({
      where: { refreshTokenId: payload.jti },
    });

    if (session && !session.revokedAt) {
      await this.databaseService.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }

  private issueTokens(userId: string, refreshTokenId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessTtl(),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: refreshTokenId },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshTtl(),
      },
    );

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.getRefreshSecret(),
      });

      if (!payload?.sub || !payload?.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private getAccessSecret() {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret'
    );
  }

  private getRefreshSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'dev-refresh-secret'
    );
  }

  private getAccessTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_ACCESS_TTL') ??
      '15m') as JwtSignOptions['expiresIn'];
  }

  private getRefreshTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_REFRESH_TTL') ??
      '7d') as JwtSignOptions['expiresIn'];
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const parts = passwordHash.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const [salt, storedHash] = parts;
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHash, 'hex');

    if (stored.length !== derived.length) {
      return false;
    }

    return timingSafeEqual(stored, derived);
  }

  private sendPasswordResetEmail(email: string, token: string) {
    // nodemailer
    console.log(`Send password reset email to ${email} with token: ${token}`);
  }

  private sendEmailVerificationEmail(email: string, token: string) {
    // nodemailer
    console.log(`Send email verification to ${email} with token: ${token}`);
  }
}
