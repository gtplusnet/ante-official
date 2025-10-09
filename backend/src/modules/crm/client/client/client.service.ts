import {
  Injectable,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Client, Location, CRMActivityType, CRMEntityType } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { CreateClientDTO } from '../../../../dto/client.validator.dto';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { ClientDataResponse } from '@shared/response/client.response';
import { EncryptionService } from '@common/encryption.service';
import { CRMActivityService } from '@modules/crm/crm-activity/crm-activity/crm-activity.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ClientService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public encryptionService: EncryptionService;
  @Inject() private crmActivityService: CRMActivityService;

  async createClient(clientDto: CreateClientDTO) {
    // check email alrady exist
    const client = await this.prisma.client.findFirst({
      where: {
        email: clientDto.email,
      },
    });

    if (client) {
      throw new ForbiddenException('Client email already exist');
    }

    // create client
    const createClientData: Prisma.ClientCreateInput = {
      name: clientDto.name,
      email: clientDto.email,
      contactNumber: clientDto.contactNumber,
      company: {
        connect: {
          id: this.utilityService.companyId,
        },
      },
      location: {
        connect: {
          id: clientDto.locationId.toString(),
        },
      },
    };

    const createResponse = await this.prisma.client.create({
      data: createClientData,
    });

    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.CREATE,
      entityType: CRMEntityType.CLIENT,
      entityId: createResponse.id,
      entityName: createResponse.name,
      description: `Created new client "${createResponse.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return this.formatResponse(createResponse);
  }
  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'client');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
      totalCount,
    } = await this.tableHandlerService.getTableData(
      this.prisma.client,
      query,
      tableQuery,
    );
    const formattedList = await this.formatResponseList(baseList as Client[]);
    return { list: formattedList, pagination, currentPage, totalCount };
  }

  async getClientById(id: number) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: id,
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      include: {
        location: true,
        company: true,
        clientLogo: true,
      },
    });

    if (!client) {
      throw new ForbiddenException('Client not found');
    }

    // Format the client data
    const formattedClient = this.formatResponse(client);

    // Add computed fields for financial data
    const projects = await this.prisma.project.findMany({
      where: {
        clientId: id,
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    });

    let totalProjectAmount = 0;
    for (const project of projects) {
      totalProjectAmount += project.budget || 0;
    }

    return {
      ...formattedClient,
      totalProjectAmount: {
        raw: totalProjectAmount,
        formatted:
          this.utilityService.formatCurrency(totalProjectAmount).formatCurrency,
      },
    };
  }

  async updateClient(id: number, updateData: Partial<CreateClientDTO>) {
    // Check if client exists
    const existingClient = await this.prisma.client.findFirst({
      where: {
        id: id,
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    });

    if (!existingClient) {
      throw new ForbiddenException('Client not found');
    }

    // If email is being updated, check if it's already in use
    if (updateData.email && updateData.email !== existingClient.email) {
      const emailExists = await this.prisma.client.findFirst({
        where: {
          email: updateData.email,
          id: { not: id },
          companyId: this.utilityService.companyId,
        },
      });

      if (emailExists) {
        throw new ForbiddenException('Email already in use by another client');
      }
    }

    // Prepare update data
    const updateClientData: Prisma.ClientUpdateInput = {};

    if (updateData.name !== undefined) {
      updateClientData.name = updateData.name;
    }

    if (updateData.email !== undefined) {
      updateClientData.email = updateData.email;
    }

    if (updateData.contactNumber !== undefined) {
      updateClientData.contactNumber = updateData.contactNumber;
    }

    if (updateData.locationId !== undefined) {
      updateClientData.location = {
        connect: {
          id: updateData.locationId.toString(),
        },
      };
    }

    // Update the client
    const updatedClient = await this.prisma.client.update({
      where: {
        id: id,
      },
      data: updateClientData,
      include: {
        location: true,
        company: true,
        clientLogo: true,
      },
    });

    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.UPDATE,
      entityType: CRMEntityType.CLIENT,
      entityId: updatedClient.id,
      entityName: updatedClient.name,
      description: `Updated client "${updatedClient.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return this.formatResponse(updatedClient);
  }

  async deleteClient(id: number) {
    // Check if client exists
    const existingClient = await this.prisma.client.findFirst({
      where: {
        id: id,
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    });

    if (!existingClient) {
      throw new ForbiddenException('Client not found');
    }

    // Soft delete the client
    const deletedClient = await this.prisma.client.update({
      where: {
        id: id,
      },
      data: {
        isDeleted: true,
      },
    });

    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.DELETE,
      entityType: CRMEntityType.CLIENT,
      entityId: deletedClient.id,
      entityName: deletedClient.name,
      description: `Deleted client "${deletedClient.name}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return this.formatResponse(deletedClient);
  }

  private formatResponse(
    client: Client & { location?: Location },
  ): ClientDataResponse {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      contactNumber: client.contactNumber,
      totalCollection: this.utilityService.formatCurrency(
        client.totalCollection || 0,
      ),
      totalCollectionBalance: this.utilityService.formatCurrency(
        client.totalCollectionBalance || 0,
      ),
      totalCollected: this.utilityService.formatCurrency(
        client.totalCollected || 0,
      ),
      isDeleted: client.isDeleted,
      createdAt: this.utilityService.formatDate(client.createdAt),
      updatedAt: this.utilityService.formatDate(client.updatedAt),
    };
  }

  private async formatResponseList(
    dataList: Client[],
  ): Promise<ClientDataResponse[]> {
    return dataList.map((client) => this.formatResponse(client));
  }

  private formatLocation(location: Location): any {
    // This should match the location format from response.reference.ts
    // For now, returning the raw location as the format is complex
    return location;
  }

  async generateShareLink(clientId: number) {
    // Verify client exists and belongs to this company
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    });

    if (!client) {
      throw new ForbiddenException('Client not found');
    }

    // Create a token payload with client ID, company ID, and timestamp
    const timestamp = Date.now();
    const payload = JSON.stringify({
      clientId,
      companyId: this.utilityService.companyId,
      timestamp,
      nonce: randomBytes(16).toString('hex'), // Add randomness to prevent predictability
    });

    // Encrypt the payload
    const { encrypted, iv } = await this.encryptionService.encrypt(payload);

    // Combine encrypted data and IV into a single token
    const token = `${encrypted}:${iv.toString('hex')}`;

    // Base64 encode for URL safety
    const shareToken = Buffer.from(token).toString('base64url');

    // Get the frontend URL from environment or use default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:6152';
    const shareLink = `${frontendUrl}/public/customer?token=${shareToken}`;

    return {
      shareLink,
      token: shareToken,
      expiresIn: '30 days', // Token doesn't expire but we can add expiration logic later
    };
  }

  async getPublicClientInfo(token: string) {
    try {
      // Decode the base64url token
      const decodedToken = Buffer.from(token, 'base64url').toString();

      // Split encrypted data and IV
      const [encrypted, ivHex] = decodedToken.split(':');
      if (!encrypted || !ivHex) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Convert IV back to Buffer
      const iv = Buffer.from(ivHex, 'hex');

      // Decrypt the payload
      const decryptedPayload = await this.encryptionService.decrypt(
        encrypted,
        iv,
      );
      const payload = JSON.parse(decryptedPayload);

      // Validate payload structure
      if (
        !payload.clientId ||
        !payload.companyId ||
        !payload.timestamp ||
        !payload.nonce
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Optional: Check token age (e.g., 30 days)
      const tokenAge = Date.now() - payload.timestamp;
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      if (tokenAge > thirtyDaysInMs) {
        throw new UnauthorizedException('Token has expired');
      }

      // Fetch client data
      const client = await this.prisma.client.findFirst({
        where: {
          id: payload.clientId,
          companyId: payload.companyId,
          isDeleted: false,
        },
        include: {
          location: true,
          company: true,
        },
      });

      if (!client) {
        throw new UnauthorizedException('Client not found or access denied');
      }

      // Return formatted client data (limited for public view)
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        contactNumber: client.contactNumber,
        location: client.location,
        company: {
          id: client.company?.id,
          name: client.company?.companyName,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async createPublicOrder(token: string, orderData: any) {
    // First validate the token and get client info
    const clientInfo = await this.getPublicClientInfo(token);

    // Here you would implement order creation logic
    // For now, returning a placeholder
    return {
      message: 'Order creation endpoint - to be implemented',
      clientId: clientInfo.id,
      orderData,
    };
  }
}
