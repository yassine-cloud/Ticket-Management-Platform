import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import type { AuthRequest } from './types/auth-request.type';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto, @Req() request: Request) {
        return this.authService.register(dto, this.getRequestContext(request));
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Req() request: Request) {
        return this.authService.login(dto, this.getRequestContext(request));
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
        return this.authService.refresh(dto, this.getRequestContext(request));
    }

    @Post('logout')
    logout(@Body() dto: LogoutDto) {
        return this.authService.logout(dto);
    }

    @Get('permissions-check')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('assign_ticket')
    permissionsCheck(@Req() request: AuthRequest) {
        return { ok: true, userId: request.user?.id ?? null };
    }

    private getRequestContext(request: Request) {
        const forwarded = request.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded?.split(',')[0]?.trim() ?? request.ip;
        const userAgent = request.headers['user-agent'] ?? null;

        return { ip, userAgent };
    }
}
