import { ChannelType } from '../../../generated/prisma/enums';

export class ChannelResponseDTO {
  id!: string;
  projectId?: string;
  ticketId?: string;
  name?: string;
  type?: ChannelType;
  createdAt!: Date;
  members?: Array<{
    id: string;
    username: string;
    displayName: string;
    email: string;
  }>;
  messageCount?: number;
}
