import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { POSDeviceService } from '../pos-device/pos-device.service';
import { AuthService } from '../auth/auth/auth.service';
import { PrismaService } from '@common/prisma.service';
import {
  POSDeviceInitializeRequest,
  CashierLoginRequest,
} from '@shared/request/pos-device.request';
import {
  POSDeviceInitializeResponse,
  CashierLoginResponse,
  CashierLogoutResponse,
} from '@shared/response/pos.response';

@ApiTags('POS - Public')
@Controller('pos')
export class PosPublicController {
  constructor(
    private readonly posDeviceService: POSDeviceService,
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Public()
  @Post('device/initialize')
  @ApiOperation({
    summary: 'Initialize POS device',
    description:
      'Binds a device fingerprint to an API key. First-time setup for POS devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device initialized successfully',
    type: POSDeviceInitializeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'API key already bound to another device',
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid API key',
  })
  async initializeDevice(
    @Body() body: POSDeviceInitializeRequest,
  ): Promise<POSDeviceInitializeResponse> {
    const result = await this.posDeviceService.initializeDevice(
      body.apiKey,
      body.deviceId,
    );
    return result;
  }

  @Public()
  @Post('cashier/login')
  @ApiOperation({
    summary: 'Cashier login for POS',
    description:
      'Authenticate cashier with username/password. Returns session token for POS operations. Requires initialized device.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cashier logged in successfully',
    type: CashierLoginResponse,
  })
  @ApiResponse({
    status: 400,
    description:
      'Device not initialized, invalid credentials, or user is not a cashier',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async cashierLogin(
    @Headers('x-api-key') apiKey: string,
    @Headers('x-device-id') deviceId: string,
    @Body() body: CashierLoginRequest,
  ): Promise<CashierLoginResponse> {
    // Validate required headers
    if (!apiKey) {
      throw new BadRequestException('x-api-key header is required');
    }
    if (!deviceId) {
      throw new BadRequestException('x-device-id header is required');
    }

    // Validate device binding
    const device = await this.posDeviceService.validateDeviceBinding(
      apiKey,
      deviceId,
    );

    // Validate cashier credentials
    const account = await this.prismaService.account.findFirst({
      where: { OR: [{ email: body.username }, { username: body.username }] },
      include: { company: true },
    });

    if (!account) {
      throw new BadRequestException('Invalid credentials');
    }

    // Check if company is active
    if (account.company && !account.company.isActive) {
      throw new BadRequestException(
        'Your company account has been deactivated. Please contact your administrator.',
      );
    }

    // Validate password
    const { EncryptionService } = await import('@common/encryption.service');
    const encryptionService = new EncryptionService();
    let isPasswordValid = false;

    // Try bcrypt first
    if (account.passwordHash) {
      const bcrypt = await import('bcrypt');
      isPasswordValid = await bcrypt.compare(body.password, account.passwordHash);
    }

    // Fall back to decryption for legacy accounts
    if (!isPasswordValid && account.password && account.key) {
      const rawPassword = await encryptionService.decrypt(
        account.password,
        account.key,
      );
      isPasswordValid = rawPassword === body.password;
    }

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Check if account has cashier data
    const cashierData = await this.prismaService.cashierData.findUnique({
      where: { accountId: account.id },
    });

    if (!cashierData) {
      throw new BadRequestException(
        'This account is not registered as a cashier',
      );
    }

    if (!cashierData.isActive) {
      throw new BadRequestException('Cashier account is inactive');
    }

    // Verify cashier belongs to same company as device
    if (account.companyId !== device.companyId) {
      throw new BadRequestException(
        'Cashier does not belong to the same company as this device',
      );
    }

    // Generate session token (using auth service)
    const mockHeaders = { 'user-agent': 'POS Device' };
    const mockIp = deviceId; // Use device ID as IP for tracking
    const sessionToken = await this.authService.generateToken(
      account,
      mockHeaders as any,
      mockIp,
    );

    return {
      sessionToken,
      accountId: account.id,
      cashierCode: cashierData.cashierCode,
      fullName: `${account.firstName} ${account.lastName}`.trim(),
      email: account.email,
    };
  }

  @Public()
  @Post('cashier/logout')
  @ApiOperation({
    summary: 'Cashier logout for POS',
    description: 'Invalidate cashier session token',
  })
  @ApiResponse({
    status: 200,
    description: 'Cashier logged out successfully',
    type: CashierLogoutResponse,
  })
  async cashierLogout(
    @Headers('x-cashier-session') sessionToken: string,
  ): Promise<CashierLogoutResponse> {
    if (!sessionToken) {
      throw new BadRequestException('x-cashier-session header is required');
    }

    // Invalidate the session token
    await this.authService.invalidateToken(sessionToken);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
