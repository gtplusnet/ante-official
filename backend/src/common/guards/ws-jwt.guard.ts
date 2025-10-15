import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AccountTokenInterface } from '../../interfaces/accountToken.interface';
import { AccountService } from '@modules/account/account/account.service';
import { AccountSocketDataInterface } from '@modules/communication/socket/socket/socket.interface';

@Injectable()
export class WsAdminGuard implements CanActivate {
  private readonly logger = new Logger(WsAdminGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly accountService: AccountService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const eventName = context.switchToWs().getPattern();

    this.logger.log(`[WS GUARD] Checking auth for event: ${eventName} from client: ${client.id}`);

    const { token } = client.handshake.auth?.token
      ? client.handshake.auth
      : client.handshake.headers;

    this.logger.log(`[WS GUARD] Token found: ${token ? 'YES' : 'NO'}`);

    const checkToken = await this.authenticateClient(token);
    if (!checkToken) {
      this.logger.error(`[WS GUARD] Token authentication failed for client: ${client.id}`);
      return false;
    }

    this.logger.log(`[WS GUARD] Token authenticated for account: ${checkToken.accountId}`);

    const accountInformation: AccountSocketDataInterface =
      await this.accountService.getAccountInformation({
        id: checkToken.accountId,
      });

    if (!accountInformation) {
      this.logger.error(`[WS GUARD] Account information not found for: ${checkToken.accountId}`);
      return false;
    }

    this.logger.log(`[WS GUARD] Account information loaded, auth successful`);

    // Store account information in the socket client data instead of CLS
    // CLS (Continuation Local Storage) doesn't work with WebSocket connections
    client.data = client.data || {};
    client.data.account = accountInformation;

    return true;
  }

  async authenticateClient(token: string): Promise<AccountTokenInterface> {
    const checkToken = await this.prisma.accountToken.findFirst({
      where: { token },
    });
    return checkToken;
  }

  async fetchClientInformation(checkToken: AccountTokenInterface) {
    const accountInformation = await this.prisma.account.findFirst({
      where: { id: checkToken.accountId },
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
      },
    });

    return accountInformation;
  }
}
