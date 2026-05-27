export class MessageResponseDTO {
  id: string;
  channelId: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    email: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    storagePath: string;
    mimeType: string;
    size: number;
  }>;
  editedAt?: Date;
  createdAt: Date;
  isDeleted: boolean;
}
