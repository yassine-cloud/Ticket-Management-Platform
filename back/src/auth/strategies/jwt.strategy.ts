import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { AuthUser } from '../types/auth-user.type';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly databaseService: DatabaseService,
        configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret'
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.databaseService.user.findUnique({
            where: { id: payload.sub },
            include: {
                roleAssignments: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        const permissions = new Set<string>();
        for (const assignment of user.roleAssignments) {
            for (const rolePermission of assignment.role.permissions) {
                permissions.add(rolePermission.permission.key);
            }
        }

        return {
            id: user.id,
            email: user.email,
            permissions: Array.from(permissions)
        };
    }
}
