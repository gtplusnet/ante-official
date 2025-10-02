import { EmailProtocol, EmailProvider } from '@prisma/client';

export interface EmailConfigurationResponse {
  id: string;
  accountId: string;
  emailProvider: EmailProvider;
  emailProtocol: EmailProtocol;
  incomingServer: string;
  incomingPort: number;
  incomingSSL: boolean;
  outgoingServer: string;
  outgoingPort: number;
  outgoingSSL: boolean;
  emailAddress: string;
  emailPassword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
