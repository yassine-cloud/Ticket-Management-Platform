/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { scryptSync } from 'crypto';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';

describe('AuthService', () => {
  let service: AuthService;

  const databaseService = {
    user: {
      findUnique: jest.fn()
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn()
  };

  const configService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: databaseService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('issues tokens on login', async () => {
    const salt = 'test-salt';
    const derived = scryptSync('Admin123!', salt, 64).toString('hex');
    const passwordHash = `${salt}:${derived}`;

    databaseService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      username: 'admin',
      displayName: 'Admin',
      passwordHash,
      isActive: true
    });
    jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
    databaseService.session.create.mockResolvedValue({ id: 'session-1' });

    const result = await service.login(
      { email: 'admin@example.com', password: 'Admin123!' },
      { ip: '127.0.0.1', userAgent: 'jest' }
    );

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(databaseService.session.create).toHaveBeenCalledTimes(1);
  });

  it('rotates refresh tokens', async () => {
    jwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'refresh-1' });
    databaseService.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenId: 'refresh-1',
      revokedAt: null
    });
    databaseService.session.update.mockResolvedValue({ id: 'session-1' });
    databaseService.session.create.mockResolvedValue({ id: 'session-2' });
    jwtService.sign.mockReturnValueOnce('access-2').mockReturnValueOnce('refresh-2');

    const result = await service.refresh(
      { refreshToken: 'refresh-token' },
      { ip: '127.0.0.1', userAgent: 'jest' }
    );

    expect(databaseService.session.update).toHaveBeenCalledTimes(1);
    expect(databaseService.session.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-2');
  });

  it('rejects revoked refresh tokens', async () => {
    jwtService.verify.mockReturnValue({ sub: 'user-1', jti: 'refresh-1' });
    databaseService.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenId: 'refresh-1',
      revokedAt: new Date()
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' })
    ).rejects.toThrow(UnauthorizedException);
  });
});
