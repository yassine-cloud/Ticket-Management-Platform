import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthController } from './auth.controller';

@Module({
	imports: [
		ConfigModule,
		DatabaseModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const accessTtl = configService.get<string>('JWT_ACCESS_TTL') ?? '15m';

				return {
					secret: configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret',
					signOptions: {
						expiresIn: accessTtl as JwtSignOptions['expiresIn']
					}
				};
			}
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
	exports: [AuthService, JwtAuthGuard, PermissionsGuard]
})
export class AuthModule {}
