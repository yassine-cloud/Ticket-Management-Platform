# File Upload Integration Guide

## Overview

The file upload module provides secure, presigned URL-based file uploads using Cloudinary. It supports attaching files to tickets, comments, and messages with complete metadata tracking.

**Key Features:**
- ✅ Presigned URLs for direct client-to-Cloudinary uploads
- ✅ No file size limits (depends on Cloudinary account)
- ✅ Metadata storage in PostgreSQL (Attachment model)
- ✅ Support for tickets, comments, and messages
- ✅ File organization by type in Cloudinary
- ✅ Uploader tracking and timestamps

## Architecture

### Flow Diagram

```
1. Client requests presigned URL
   ↓
2. Backend generates signature (HMAC-SHA1) + token
   ↓
3. Client uploads file directly to Cloudinary
   ↓
4. Client gets secure_url from Cloudinary response
   ↓
5. Client sends metadata to backend
   ↓
6. Backend stores metadata in database (Attachment model)
```

## API Endpoints

### 1. Generate Presigned URL

**Endpoint:**
```
POST /files/presign
```

**Headers:**
```
x-user-id: {userId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "ticket|comment|message|general",
  "ticketId": "uuid (optional, required if type=ticket)",
  "commentId": "uuid (optional, required if type=comment)",
  "messageId": "uuid (optional, required if type=message)",
  "filename": "document.pdf",
  "mimeType": "application/pdf"
}
```

**Response:**
```json
{
  "signature": "abc123def456...",
  "timestamp": 1716057600,
  "cloudName": "your_cloud_name",
  "apiKey": "your_api_key",
  "folder": "tickets/files/ticket",
  "cloudinaryUrl": "https://api.cloudinary.com/v1_1/your_cloud_name/auto/upload",
  "uploadToken": "random_hex_string_for_tracking"
}
```

---

### 2. Store File Metadata

**Endpoint:**
```
POST /files/metadata
```

**Headers:**
```
x-user-id: {userId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cloudinaryPublicId": "tickets/files/ticket/abc123",
  "secureUrl": "https://res.cloudinary.com/your_cloud/image/upload/v1716057600/tickets/files/ticket/abc123.pdf",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "ticketId": "uuid (optional)",
  "commentId": "uuid (optional)",
  "messageId": "uuid (optional)"
}
```

**Response:**
```json
{
  "id": "file-uuid",
  "filename": "document.pdf",
  "url": "https://res.cloudinary.com/.../document.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "uploadedBy": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "displayName": "John Doe"
  },
  "uploadedAt": "2024-05-18T12:00:00Z",
  "attachedTo": {
    "ticketId": "ticket-uuid",
    "commentId": null,
    "messageId": null
  }
}
```

---

### 3. Get File Metadata

**Endpoint:**
```
GET /files/:fileId
```

**Response:**
```json
{
  "id": "file-uuid",
  "filename": "document.pdf",
  "url": "https://res.cloudinary.com/.../document.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "uploadedBy": { ... },
  "uploadedAt": "2024-05-18T12:00:00Z",
  "attachedTo": { ... }
}
```

---

### 4. Delete File

**Endpoint:**
```
DELETE /files/:fileId
```

**Response:** `204 No Content`

---

### 5. Get Ticket Files

**Endpoint:**
```
GET /files/ticket/:ticketId
```

**Response:**
```json
[
  {
    "id": "file-uuid-1",
    "filename": "document.pdf",
    "url": "https://res.cloudinary.com/.../document.pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "uploadedBy": { ... },
    "uploadedAt": "2024-05-18T12:00:00Z"
  },
  ...
]
```

---

### 6. Get Comment Files

**Endpoint:**
```
GET /files/comment/:commentId
```

**Response:** Array of file objects (same as ticket files)

---

### 7. Get Message Files

**Endpoint:**
```
GET /files/message/:messageId
```

**Response:** Array of file objects (same as ticket files)

---

## Frontend Implementation

### Complete File Upload Example

```typescript
// 1. Get presigned URL
const getPresignUrl = async (file: File, attachTo: 'ticket' | 'comment' | 'message', entityId: string) => {
  const response = await fetch('http://localhost:3000/files/presign', {
    method: 'POST',
    headers: {
      'x-user-id': userId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: attachTo,
      [`${attachTo}Id`]: entityId,
      filename: file.name,
      mimeType: file.type,
    }),
  });

  return await response.json();
};

// 2. Upload to Cloudinary
const uploadToCloudinary = async (
  file: File,
  presignData: any
): Promise<{ public_id: string; secure_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', presignData.signature);
  formData.append('timestamp', presignData.timestamp.toString());
  formData.append('api_key', presignData.apiKey);
  formData.append('folder', presignData.folder);

  const response = await fetch(presignData.cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await response.json();
  return {
    public_id: data.public_id,
    secure_url: data.secure_url,
  };
};

// 3. Store metadata
const storeMetadata = async (
  file: File,
  cloudinaryData: any,
  attachTo: 'ticket' | 'comment' | 'message',
  entityId: string
) => {
  const response = await fetch('http://localhost:3000/files/metadata', {
    method: 'POST',
    headers: {
      'x-user-id': userId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cloudinaryPublicId: cloudinaryData.public_id,
      secureUrl: cloudinaryData.secure_url,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      [`${attachTo}Id`]: entityId,
    }),
  });

  return await response.json();
};

// 4. Complete workflow
const handleFileUpload = async (
  file: File,
  attachTo: 'ticket' | 'comment' | 'message',
  entityId: string
) => {
  try {
    // Step 1: Get presigned URL
    const presignData = await getPresignUrl(file, attachTo, entityId);

    // Step 2: Upload to Cloudinary
    const cloudinaryData = await uploadToCloudinary(file, presignData);

    // Step 3: Store metadata
    const metadata = await storeMetadata(file, cloudinaryData, attachTo, entityId);

    console.log('File uploaded successfully!', metadata);
    return metadata;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

---

## React Component Example

```typescript
'use client';

import { useState } from 'react';

export function FileUploadComponent({ ticketId, onUploadComplete }: any) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get presigned URL
      const presignRes = await fetch('http://localhost:3000/files/presign', {
        method: 'POST',
        headers: {
          'x-user-id': 'your-user-id',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ticket',
          ticketId,
          filename: file.name,
          mimeType: file.type,
        }),
      });
      const presignData = await presignRes.json();

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', presignData.signature);
      formData.append('timestamp', presignData.timestamp.toString());
      formData.append('api_key', presignData.apiKey);
      formData.append('folder', presignData.folder);

      const uploadRes = await fetch(presignData.cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // 3. Store metadata
      const metadataRes = await fetch('http://localhost:3000/files/metadata', {
        method: 'POST',
        headers: {
          'x-user-id': 'your-user-id',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloudinaryPublicId: uploadData.public_id,
          secureUrl: uploadData.secure_url,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          ticketId,
        }),
      });
      const metadata = await metadataRes.json();

      setFiles([...files, metadata]);
      onUploadComplete?.(metadata);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Upload File</label>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="mt-2"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Attached Files</h3>
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{file.filename}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Attachment Model

The `Attachment` model in the database tracks all uploaded files:

```prisma
model Attachment {
  id          String   @id @default(uuid())
  ticketId    String?  // Link to ticket
  commentId   String?  // Link to comment
  messageId   String?  // Link to message
  uploaderId  String   // Who uploaded it
  storagePath String   // Cloudinary secure_url
  filename    String   // Original filename
  mimeType    String   // File MIME type
  size        Int      // File size in bytes
  checksum    String?  // Cloudinary public_id for reference
  createdAt   DateTime @default(now())

  // Relations
  ticket   Ticket?       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  comment  TicketComment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  message  Message?      @relation(fields: [messageId], references: [id], onDelete: Cascade)
  uploader User          @relation(fields: [uploaderId], references: [id], onDelete: Cascade)

  @@index([ticketId])
  @@index([commentId])
  @@index([messageId])
}
```

---

## File Organization in Cloudinary

Files are organized by type in Cloudinary folders:

```
tickets/files/
  ├── ticket/
  │   ├── file1.pdf
  │   ├── image1.jpg
  │   └── ...
  ├── comment/
  │   ├── file2.docx
  │   └── ...
  ├── message/
  │   ├── file3.mp4
  │   └── ...
  └── general/
      └── ...
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing x-user-id header` | User ID not provided | Add `x-user-id` header to request |
| `At least one parent entity must be provided` | No ticketId, commentId, or messageId | Specify which entity to attach file to |
| `Cloudinary credentials not configured` | Missing env variables | Set CLOUDINARY_* in .env |
| `File not found` | Invalid fileId | Use correct file UUID |
| `Cloudinary upload failed` | Invalid signature or credentials | Verify signature generation and credentials |

### Example Error Response

```json
{
  "statusCode": 400,
  "message": "At least one parent entity (ticketId, commentId, or messageId) must be provided",
  "error": "Bad Request"
}
```

---

## Environment Configuration

### Backend (.env)

```env
# Cloudinary (required for file uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ticket_db"
```

---

## Security Considerations

1. **Authentication**: All endpoints require `x-user-id` header (will upgrade to JWT)
2. **File Validation**: 
   - Validate MIME types on frontend and backend
   - Implement file size limits if needed
3. **Access Control**:
   - Users can only upload files they have permission to
   - Consider implementing permission checks per entity
4. **Storage Security**:
   - Cloudinary handles file security with signed URLs
   - Private files use restricted tokens
5. **Metadata Security**:
   - File paths stored in database are protected by RBAC
   - Consider encrypting sensitive file paths

---

## Performance Tips

1. **Large Files**: 
   - Use multipart uploads for files > 100MB
   - Implement progress tracking on frontend
2. **Metadata Queries**:
   - Use indexed columns (ticketId, commentId, messageId)
   - Paginate file lists for entities with many attachments
3. **Caching**:
   - Cache file metadata in frontend state
   - Use Cloudinary CDN for file delivery
4. **Cleanup**:
   - Implement periodic cleanup of orphaned files
   - Delete from Cloudinary when database records are removed

---

## Limitations & Future Improvements

### Current Limitations
- No virus scanning (consider adding Cloudinary add-on)
- No file preview generation (except Cloudinary's built-in)
- No file versioning
- No bandwidth throttling

### Future Improvements
1. **Virus Scanning**: Add ClamAV or Cloudinary virus scanning add-on
2. **File Preview**: Generate thumbnails for images/PDFs
3. **Compression**: Compress images automatically on upload
4. **Archival**: Archive old files to cold storage
5. **Expiration**: Auto-delete files after specified period
6. **Quota Management**: Implement per-project/user upload quotas
7. **Direct Deletion**: Delete from Cloudinary when file is removed

---

## Testing

### Using curl

```bash
# 1. Get presigned URL
curl -X POST http://localhost:3000/files/presign \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ticket",
    "ticketId": "ticket-456",
    "filename": "document.pdf",
    "mimeType": "application/pdf"
  }'

# 2. Upload to Cloudinary (after getting presigned data)
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD/auto/upload \
  -F "file=@document.pdf" \
  -F "signature=SIGNATURE_FROM_STEP_1" \
  -F "timestamp=TIMESTAMP_FROM_STEP_1" \
  -F "api_key=YOUR_API_KEY" \
  -F "folder=tickets/files/ticket"

# 3. Store metadata
curl -X POST http://localhost:3000/files/metadata \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "cloudinaryPublicId": "tickets/files/ticket/abc123",
    "secureUrl": "https://res.cloudinary.com/.../document.pdf",
    "filename": "document.pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "ticketId": "ticket-456"
  }'
```

---

## Troubleshooting

### File Upload Fails with 400
- Verify all required fields in presign request
- Check that ticketId/commentId/messageId is valid UUID format
- Ensure MIME type is correct

### Cloudinary Signature Invalid
- Verify API_SECRET is correct
- Check timestamp is within 1 hour of server time
- Ensure signature generation uses correct algorithm (HMAC-SHA1)

### Files Not Appearing in Database
- Check that metadata endpoint was called with correct data
- Verify userId matches the uploader
- Check database connection and migration status

### CORS Errors on Frontend
- Backend has global CORS enabled
- For production, configure specific origins in main.ts

---

## Support

For issues with file uploads:
1. Check backend logs for errors
2. Verify Cloudinary credentials and quotas
3. Check database migrations completed
4. Review network tab in browser DevTools
5. Ensure files are uploaded to correct Cloudinary folder

---

## Next Steps

1. Implement JWT authentication (from dedicated branch)
2. Add file type restrictions
3. Add file size limits
4. Implement virus scanning
5. Add file preview generation
6. Implement cleanup/archival policies
