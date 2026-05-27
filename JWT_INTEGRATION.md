# JWT Authentication Integration Guide for Messaging Module

## Overview

This guide is for integrating JWT authentication into the messaging module. The current implementation uses a temporary `x-user-id` header for testing. This document outlines exactly what needs to be changed to support JWT tokens.

## Current Authentication Status

### Temporary Setup (Testing Phase)
- **Header**: `x-user-id: {userId}` (string)
- **Location**: All controllers read from `req.headers['x-user-id'] || req.user?.id || 'user-id-placeholder'`
- **Reason**: Placeholder while JWT branch is being developed

### Target Setup (JWT)
- **Header**: `Authorization: Bearer {jwtToken}` (standard)
- **Validation**: JWT middleware to extract and validate token
- **Payload**: Should include `userId`, `email`, `username`

## Files to Update

### 1. Controllers (3 files)

#### File: `back/src/messaging/channels/channels.controller.ts`

**Current Implementation:**
```typescript
@Controller('channels')
export class ChannelsController {
  @Post()
  async createChannel(
    @Body() dto: CreateChannelDto,
    @Req() req: Request,
  ) {
    const userId = req.headers['x-user-id'] || req.user?.id || 'user-id-placeholder';
    // ... rest of method
  }
}
```

**JWT Implementation:**
```typescript
@Controller('channels')
export class ChannelsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async createChannel(
    @Body() dto: CreateChannelDto,
    @Req() req: Request,
  ) {
    const userId = req.user.id;  // Extracted from JWT by guard
    // ... rest of method
  }
}
```

**Changes Needed:**
- Add `@UseGuards(JwtAuthGuard)` decorator
- Replace `req.headers['x-user-id']` with `req.user.id`
- Remove fallback logic

**All methods to update in ChannelsController:**
- `POST /channels` - createChannel
- `GET /channels` - getChannels
- `GET /channels/:channelId` - getChannelById
- `PATCH /channels/:channelId` - updateChannel
- `DELETE /channels/:channelId` - deleteChannel
- `PATCH /channels/:channelId/restore` - restoreChannel
- `POST /channels/:channelId/members` - addMember
- `DELETE /channels/:channelId/members/:userId` - removeMember
- `GET /channels/:channelId/members` - getMembers

---

#### File: `back/src/messaging/messages/messages.controller.ts`

**Current Implementation:**
```typescript
@Post()
async createMessage(
  @Body() dto: CreateMessageDto,
  @Req() req: Request,
) {
  const userId = req.headers['x-user-id'] || req.user?.id || 'user-id-placeholder';
  // ... rest of method
}
```

**JWT Implementation:**
```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createMessage(
  @Body() dto: CreateMessageDto,
  @Req() req: Request,
) {
  const userId = req.user.id;
  // ... rest of method
}
```

**All methods to update in MessagesController:**
- `POST /messages` - createMessage
- `GET /messages` - getMessages
- `GET /messages/:messageId` - getMessageById
- `PATCH /messages/:messageId` - updateMessage
- `DELETE /messages/:messageId` - deleteMessage
- `POST /messages/upload-signature` - getUploadSignature

---

#### File: `back/src/app.controller.ts`

**Current:** No changes needed - test endpoint already removed.

**Note:** If you need a test endpoint for JWT token generation, add:
```typescript
@Post('auth/test-token')
async generateTestToken() {
  // Generate JWT token for testing
  // This should be removed in production
  const payload = { userId: 'user-123', email: 'test@example.com' };
  return {
    access_token: this.jwtService.sign(payload),
  };
}
```

---

### 2. Create JWT Guard

**File**: `back/src/auth/guards/jwt.guard.ts` (NEW)

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

---

### 3. Create JWT Strategy

**File**: `back/src/auth/strategies/jwt.strategy.ts` (NEW)

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
    };
  }
}
```

---

### 4. Create Auth Module

**File**: `back/src/auth/auth.module.ts` (NEW)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
        },
      }),
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
```

---

### 5. Update App Module

**File**: `back/src/app.module.ts`

**Add AuthModule import:**
```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,  // Add this
    DatabaseModule,
    MessagingModule,
    // ... other modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

### 6. Environment Variables

**File**: `back/.env`

**Add JWT configuration:**
```env
# Existing
DATABASE_URL="postgresql://user:password@localhost:5432/ticket_db"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# New - JWT Configuration
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRATION="24h"
```

---

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

### Step 2: Create Auth Module Structure

```bash
mkdir -p src/auth/guards
mkdir -p src/auth/strategies
```

### Step 3: Create Strategy and Guard Files

Create the files listed in sections 2 and 3 above.

### Step 4: Update App Module

Add AuthModule to imports (see section 5).

### Step 5: Update Controllers

For each controller method, add:
1. `@UseGuards(JwtAuthGuard)` decorator
2. Replace `req.headers['x-user-id']` with `req.user.id`

### Step 6: Add JWT Configuration

Update `back/.env` with JWT_SECRET and JWT_EXPIRATION.

### Step 7: Test

Use curl or Postman to test with Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/channels?projectId=PROJECT_ID
```

---

## Migration Strategy

### Phase 1: Parallel Support (Optional)
Allow both `x-user-id` header and JWT tokens temporarily:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createChannel(
  @Body() dto: CreateChannelDto,
  @Req() req: Request,
) {
  // Try JWT first, fall back to x-user-id if no JWT provided
  const userId = req.user?.id || req.headers['x-user-id'];
  if (!userId) {
    throw new UnauthorizedException('No userId provided');
  }
  // ... rest of method
}
```

### Phase 2: JWT Only
Remove the x-user-id fallback after all clients are migrated.

---

## Testing the Integration

### Generate Test Token (for development)

Add a test endpoint temporarily:

```typescript
// back/src/auth/auth.controller.ts
import { Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('test-token')
  getTestToken() {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser',
    };
    return {
      access_token: this.jwtService.sign(payload),
      expiresIn: '24h',
    };
  }
}
```

### Test Request

```bash
# Get a test token
TOKEN=$(curl -X POST http://localhost:3000/auth/test-token | jq -r '.access_token')

# Use token in request
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/channels?projectId=PROJECT_ID
```

---

## Frontend Changes

### Update API Calls

**Current (with x-user-id):**
```typescript
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-user-id': userId,
});

fetch(`${API_URL}/channels`, {
  headers: getHeaders(),
});
```

**JWT (with localStorage token):**
```typescript
const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

fetch(`${API_URL}/channels`, {
  headers: getHeaders(),
});
```

---

## Common Issues & Solutions

### Issue: "Unauthorized" on all requests
- **Cause**: JWT_SECRET mismatch between signing and verification
- **Solution**: Ensure JWT_SECRET in .env is the same where token was created

### Issue: Token expired errors
- **Cause**: Token expiration set too short
- **Solution**: Increase JWT_EXPIRATION in .env (e.g., "7d")

### Issue: "No auth strategy found"
- **Cause**: AuthModule not imported in AppModule
- **Solution**: Add AuthModule to imports array in app.module.ts

### Issue: Can't extract token from header
- **Cause**: Wrong Authorization header format
- **Solution**: Must be "Bearer {token}" not "Bearer{token}" (note the space)

---

## Security Considerations

1. **Secret Key**: Use a strong, randomly generated secret in production
2. **Token Expiration**: Set reasonable expiration (24h, 7d, etc.)
3. **Refresh Tokens**: Consider implementing refresh token rotation
4. **HTTPS**: Always use HTTPS in production
5. **Token Storage**: Store tokens securely on frontend (not plain localStorage for sensitive apps)
6. **Validation**: Always validate token claims (userId, permissions, etc.)

---

## Rollback Plan

If JWT implementation needs to be rolled back:

1. Remove `@UseGuards(JwtAuthGuard)` from all methods
2. Restore fallback: `const userId = req.headers['x-user-id'] || ...`
3. Comment out or remove AuthModule import
4. The system will work with x-user-id headers again

---

## Code Diff Summary

### Controllers (All 3 files)

```diff
  @Post()
+ @UseGuards(JwtAuthGuard)
  async createChannel(
    @Body() dto: CreateChannelDto,
    @Req() req: Request,
  ) {
-   const userId = req.headers['x-user-id'] || req.user?.id || 'user-id-placeholder';
+   const userId = req.user.id;
    // ... rest of code unchanged
  }
```

Apply this pattern to all methods in:
- `channels.controller.ts`
- `messages.controller.ts`

### New Files to Create

1. `src/auth/strategies/jwt.strategy.ts` - JWT strategy
2. `src/auth/guards/jwt.guard.ts` - JWT guard
3. `src/auth/auth.module.ts` - Auth module

### Updated Files

1. `src/app.module.ts` - Add AuthModule import
2. `.env` - Add JWT_SECRET and JWT_EXPIRATION

---

## Support

For questions about JWT integration:
- Refer to [NestJS JWT documentation](https://docs.nestjs.com/techniques/authentication#jwt-functionality)
- Check Passport.js documentation for strategy details
- Review the messaging module structure for examples of other guards/interceptors

Good luck with the integration! 🚀
