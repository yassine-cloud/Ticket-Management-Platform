# Messaging Module Integration Guide

## Overview

The messaging module provides real-time communication features for the Ticket Management Platform, including:
- **Channels**: Project-based communication channels (private, project-wide)
- **Messages**: Send and receive messages with file attachments
- **File Uploads**: Cloudinary integration for secure file storage
- **Real-time Updates**: WebSocket support via Socket.IO (core infrastructure in place)

## Architecture

### Backend Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO (WebSocket gateway)
- **Port**: `3000`

### Frontend Stack
- **Framework**: Next.js 16.2.6 with React 19.2.4
- **Port**: `3001`

### Database Models
- `Channel` - Communication channels
- `Message` - Channel messages with attachments
- `ChannelMember` - Channel membership tracking
- `Attachment` - File metadata

## API Endpoints

### Channels

#### Create Channel
```
POST /channels
Headers: x-user-id: {userId}
Body: {
  projectId: string (UUID)
  name: string
  type: "PROJECT" | "PRIVATE" | "DIRECT"
}
Response: { id, name, type, projectId, createdAt, updatedAt }
```

#### Get Channels
```
GET /channels?projectId={projectId}
Headers: x-user-id: {userId}
Response: Channel[]
```

#### Get Channel by ID
```
GET /channels/:channelId
Headers: x-user-id: {userId}
Response: Channel
```

#### Update Channel
```
PATCH /channels/:channelId
Headers: x-user-id: {userId}
Body: { name?: string, type?: string, archived?: boolean }
Response: Channel
```

#### Delete Channel (soft delete)
```
DELETE /channels/:channelId
Headers: x-user-id: {userId}
Response: { message: "Channel deleted" }
```

#### Restore Deleted Channel
```
PATCH /channels/:channelId/restore
Headers: x-user-id: {userId}
Response: Channel
```

#### Add Member to Channel
```
POST /channels/:channelId/members
Headers: x-user-id: {userId}
Body: { userId: string }
Response: ChannelMember
```

#### Remove Member from Channel
```
DELETE /channels/:channelId/members/:userId
Headers: x-user-id: {userId}
Response: { message: "Member removed" }
```

#### Get Channel Members
```
GET /channels/:channelId/members
Headers: x-user-id: {userId}
Response: ChannelMember[]
```

### Messages

#### Send Message
```
POST /messages
Headers: x-user-id: {userId}
Body: {
  channelId: string (UUID)
  content: string (required, non-empty)
  attachmentUrls?: string[] (optional URLs from Cloudinary)
}
Response: { 
  id, channelId, content, authorId, 
  author: { id, email, username, displayName },
  attachments: Attachment[],
  createdAt, updatedAt 
}
```

#### Get Messages
```
GET /messages?channelId={channelId}&skip={skip}&take={take}
Headers: x-user-id: {userId}
Query Params:
  - channelId: string (required)
  - skip: number (default: 0)
  - take: number (default: 50, max: 100)
Response: Message[]
```

#### Get Message by ID
```
GET /messages/:messageId
Headers: x-user-id: {userId}
Response: Message
```

#### Update Message
```
PATCH /messages/:messageId
Headers: x-user-id: {userId}
Body: { content?: string, attachmentUrls?: string[] }
Response: Message
```

#### Delete Message (soft delete)
```
DELETE /messages/:messageId
Headers: x-user-id: {userId}
Response: { message: "Message deleted" }
```

#### Get Cloudinary Upload Signature
```
POST /messages/upload-signature
Headers: x-user-id: {userId}
Response: {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}
```

## Authentication

### Current Implementation
All endpoints require the `x-user-id` header:
```
x-user-id: {userId}
```

### Future: JWT Authentication
A separate branch is being prepared for JWT token-based authentication. This will replace the `x-user-id` header with Bearer tokens.

## File Upload Flow

### 1. Get Upload Signature
```typescript
const signatureResponse = await fetch('/messages/upload-signature', {
  method: 'POST',
  headers: { 'x-user-id': userId }
});
const { signature, timestamp, cloudName, apiKey, folder } = await signatureResponse.json();
```

### 2. Upload to Cloudinary
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('signature', signature);
formData.append('timestamp', timestamp.toString());
formData.append('api_key', apiKey);
formData.append('folder', folder);

const uploadResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  { method: 'POST', body: formData }
);
const { secure_url } = await uploadResponse.json();
```

### 3. Send Message with Attachment
```typescript
await fetch('/messages', {
  method: 'POST',
  headers: { 
    'x-user-id': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId,
    content: 'Check out this file!',
    attachmentUrls: [secure_url]
  })
});
```

## Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ticket_db"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Optional: JWT (when JWT branch is merged)
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION="24h"
```

### Database Setup
1. Ensure PostgreSQL is running
2. Run migrations:
   ```bash
   cd back
   npm run prisma:migrate
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Getting Started

### 1. Backend Setup
```bash
cd back

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in values
cp .env.example .env

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Start the server
npm run start
```

### 2. Frontend Setup
```bash
cd front

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3001`

## Usage Example: Complete Workflow

### Frontend (React/Next.js)
```typescript
// 1. Create a channel
const createChannelResponse = await fetch('http://localhost:3000/channels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123'
  },
  body: JSON.stringify({
    projectId: 'project-456',
    name: 'General Discussion',
    type: 'PROJECT'
  })
});
const channel = await createChannelResponse.json();

// 2. Get channel messages
const messagesResponse = await fetch(
  `http://localhost:3000/messages?channelId=${channel.id}&take=50`,
  {
    headers: { 'x-user-id': 'user-123' }
  }
);
const messages = await messagesResponse.json();

// 3. Upload a file
const signatureResponse = await fetch(
  'http://localhost:3000/messages/upload-signature',
  {
    method: 'POST',
    headers: { 'x-user-id': 'user-123' }
  }
);
const { signature, timestamp, cloudName, apiKey, folder } = await signatureResponse.json();

const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('signature', signature);
formData.append('timestamp', timestamp.toString());
formData.append('api_key', apiKey);
formData.append('folder', folder);

const uploadResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  { method: 'POST', body: formData }
);
const uploadData = await uploadResponse.json();

// 4. Send message with attachment
const messageResponse = await fetch('http://localhost:3000/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123'
  },
  body: JSON.stringify({
    channelId: channel.id,
    content: 'Check out this file!',
    attachmentUrls: [uploadData.secure_url]
  })
});
const message = await messageResponse.json();
```

## WebSocket Support (Infrastructure Ready)

Socket.IO is configured for real-time features. Current support:
- ✅ Gateway infrastructure in place
- ✅ Connection handling
- ⏳ Event handlers to be implemented:
  - `join-channel` - User joins a channel
  - `typing` - User is typing indicator
  - `message` - Real-time message delivery
  - `leave-channel` - User leaves a channel

### Example Socket.IO Usage (Future)
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  extraHeaders: {
    'x-user-id': 'user-123'
  }
});

socket.on('connect', () => {
  socket.emit('join-channel', { channelId: 'channel-456' });
});

socket.on('message', (data) => {
  console.log('New message:', data);
});

socket.on('typing', (data) => {
  console.log('User typing:', data.userId);
});
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing x-user-id)
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Server Error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Validation Rules

### Channel Name
- Required
- Non-empty string
- Max 255 characters

### Channel Type
- Required
- Must be one of: `PROJECT`, `PRIVATE`, `DIRECT`

### Message Content
- Required
- Non-empty string
- Max 5000 characters

### Attachment URLs
- Optional array
- Each URL must be valid HTTP/HTTPS

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding in production:
- Message send: 10 messages/minute per user/channel
- File upload: 5 files/minute per user
- API calls: 100 requests/minute per user

## Security Considerations

1. **Authentication**: Upgrade to JWT tokens (separate branch ready)
2. **Authorization**: Verify user is channel member before allowing message send
3. **File Validation**: Validate file types on server-side
4. **CORS**: Configure for production domain
5. **Input Sanitization**: Sanitize message content for XSS prevention

## Performance Tips

1. **Pagination**: Always use `skip` and `take` when fetching messages
2. **Lazy Loading**: Load channels and messages on-demand
3. **Caching**: Implement client-side cache for frequently accessed channels
4. **WebSocket**: Use WebSocket for real-time updates instead of polling

## Troubleshooting

### Connection Refused
- Ensure backend is running on port 3000
- Check DATABASE_URL environment variable
- Verify PostgreSQL is running

### File Upload Fails
- Verify Cloudinary credentials in .env
- Check file size limits (default: 100MB)
- Ensure folder permissions in Cloudinary

### CORS Errors
- Backend has global CORS enabled (origin: '*')
- For production, configure specific origins in `main.ts`

### Message Not Appearing
- Verify channel membership
- Check x-user-id header is sent
- Confirm message content is not empty

## Support

For issues, check:
1. Backend logs: `back/` terminal
2. Frontend console: Browser DevTools
3. Database: Verify migrations completed
4. Cloudinary: Check upload logs in dashboard

## Next Steps

1. Implement JWT authentication (from dedicated branch)
2. Add WebSocket event handlers for real-time features
3. Implement message search functionality
4. Add message reactions and threaded replies
5. Add typing indicators
6. Implement read receipts
