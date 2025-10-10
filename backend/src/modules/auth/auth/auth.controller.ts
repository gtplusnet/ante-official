import {
  Inject,
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Headers,
  Ip,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { InviteService } from './invite.service';
import {
  AccountLoginDTO,
  SignUpDTO,
  GoogleLoginDTO,
  FacebookLoginDTO,
} from './auth.validator';
import {
  SendInviteDTO,
  AcceptInviteDTO,
  ResendInviteDTO,
  VerifyInviteTokenDTO,
  AcceptInviteWithGoogleDTO,
  AcceptInviteWithFacebookDTO,
} from './invite.validator';
import { UtilityService } from '@common/utility.service';
import { LoginResponse } from '../../../shared/response/auth.response';
import { RedisService } from '@infrastructure/redis/redis.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  @Inject() public authService: AuthService;
  @Inject() public emailVerificationService: EmailVerificationService;
  @Inject() public inviteService: InviteService;
  @Inject() public utility: UtilityService;
  @Inject() private redisService: RedisService;

  @Public()
  @ApiOperation({ summary: 'User login with username/password' })
  @Post('login')
  async login(
    @Res() response,
    @Body() params: AccountLoginDTO,
    @Headers() headers,
    @Ip() ip,
  ): Promise<LoginResponse> {
    const loginResponse: LoginResponse = await this.authService.login(
      params,
      headers,
      ip,
    );
    return response.status(HttpStatus.OK).json(loginResponse);
  }

  @Public()
  @ApiOperation({ summary: 'Create new user account' })
  @Post('signup')
  async signup(
    @Res() response,
    @Body() params: SignUpDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    const signUpResponse = await this.authService.signUp(params, headers, ip);
    return response.status(HttpStatus.CREATED).json(signUpResponse);
  }

  @Public()
  @ApiOperation({ summary: 'Login with Google OAuth' })
  @Post('login/google')
  async loginWithGoogle(
    @Res() response,
    @Body() params: GoogleLoginDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    try {
      const loginResponse = await this.authService.loginWithGoogle(
        params.googleIdToken,
        headers,
        ip,
      );
      return response.status(HttpStatus.OK).json(loginResponse);
    } catch (err) {
      return this.utility.errorResponse(response, err, 'Google login failed');
    }
  }

  @Public()
  @ApiOperation({ summary: 'Login with Facebook OAuth' })
  @Post('login/facebook')
  async loginWithFacebook(
    @Res() response,
    @Body() params: FacebookLoginDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    try {
      const loginResponse = await this.authService.loginWithFacebook(
        params.facebookAccessToken,
        headers,
        ip,
      );
      return response.status(HttpStatus.OK).json(loginResponse);
    } catch (err) {
      return this.utility.errorResponse(response, err, 'Facebook login failed');
    }
  }

  @Get('verify-email/:token')
  async verifyEmail(@Res() response, @Param('token') token: string) {
    try {
      const accountData =
        await this.emailVerificationService.verifyEmail(token);
      return response.status(HttpStatus.OK).json({
        message: 'Email verified successfully',
        accountInformation: accountData,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Email verification failed',
      );
    }
  }

  @Post('resend-verification')
  async resendVerification(@Res() response) {
    try {
      const accountId = this.utility.accountInformation.id;
      await this.emailVerificationService.resendVerificationEmail(accountId);
      return response.status(HttpStatus.OK).json({
        message: 'Verification email sent successfully',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to send verification email',
      );
    }
  }

  // Invite endpoints
  @Post('invite/send')
  async sendInvite(@Res() response, @Body() params: SendInviteDTO) {
    try {
      const invitedById = this.utility.accountInformation.id;
      const companyId = this.utility.companyId;

      const invite = await this.inviteService.sendInvite(
        {
          email: params.email,
          firstName: params.firstName,
          lastName: params.lastName,
          roleId: params.roleID,
          parentAccountId: params.parentAccountId,
        },
        invitedById,
        companyId,
      );

      return response.status(HttpStatus.CREATED).json({
        message: 'Invitation sent successfully',
        invite,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to send invitation',
      );
    }
  }

  @Get('invite/verify/:token')
  async verifyInviteToken(
    @Res() response,
    @Param() params: VerifyInviteTokenDTO,
  ) {
    try {
      const invite = await this.inviteService.verifyInviteToken(params.token);
      return response.status(HttpStatus.OK).json({
        valid: true,
        invite: {
          email: invite.email,
          firstName: invite.firstName,
          lastName: invite.lastName,
          role: invite.role,
          company: invite.company,
        },
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Invalid invitation token',
      );
    }
  }

  @Post('invite/accept')
  async acceptInvite(
    @Res() response,
    @Body() params: AcceptInviteDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    try {
      await this.inviteService.acceptInvite({
        token: params.token,
        username: params.username,
        password: params.password,
        contactNumber: params.contactNumber,
        dateOfBirth: params.dateOfBirth
          ? new Date(params.dateOfBirth)
          : undefined,
      });

      // Auto-login the user after accepting invite
      const loginResponse = await this.authService.login(
        {
          username: params.username,
          password: params.password,
        },
        headers,
        ip,
      );

      return response.status(HttpStatus.OK).json({
        message: 'Invitation accepted successfully',
        ...loginResponse,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to accept invitation',
      );
    }
  }

  @Post('invite/accept-google')
  async acceptInviteWithGoogle(
    @Res() response,
    @Body() params: AcceptInviteWithGoogleDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    try {
      await this.inviteService.acceptInviteWithGoogle({
        token: params.token,
        googleIdToken: params.googleIdToken,
        contactNumber: params.contactNumber,
        dateOfBirth: params.dateOfBirth
          ? new Date(params.dateOfBirth)
          : undefined,
      });

      // Auto-login the user after accepting invite with Google
      const loginResponse = await this.authService.loginWithGoogle(
        params.googleIdToken,
        headers,
        ip,
      );

      return response.status(HttpStatus.OK).json({
        message: 'Invitation accepted successfully with Google',
        ...loginResponse,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to accept invitation with Google',
      );
    }
  }

  @Post('invite/accept-facebook')
  async acceptInviteWithFacebook(
    @Res() response,
    @Body() params: AcceptInviteWithFacebookDTO,
    @Headers() headers,
    @Ip() ip,
  ) {
    try {
      console.log('Facebook invite acceptance request:', {
        token: params.token,
        hasAccessToken: !!params.facebookAccessToken,
        tokenLength: params.token?.length,
      });

      await this.inviteService.acceptInviteWithFacebook({
        token: params.token,
        facebookAccessToken: params.facebookAccessToken,
        contactNumber: params.contactNumber,
        dateOfBirth: params.dateOfBirth
          ? new Date(params.dateOfBirth)
          : undefined,
      });

      // Auto-login the user after accepting invite with Facebook
      const loginResponse = await this.authService.loginWithFacebook(
        params.facebookAccessToken,
        headers,
        ip,
      );

      return response.status(HttpStatus.OK).json({
        message: 'Invitation accepted successfully with Facebook',
        ...loginResponse,
      });
    } catch (err) {
      console.error(
        'Error in acceptInviteWithFacebook:',
        err.message,
        err.stack,
      );
      return this.utility.errorResponse(
        response,
        err,
        'Failed to accept invitation with Facebook',
      );
    }
  }

  @Post('invite/resend')
  async resendInvite(@Res() response, @Body() params: ResendInviteDTO) {
    try {
      await this.inviteService.resendInvite(params.inviteId);
      return response.status(HttpStatus.OK).json({
        message: 'Invitation resent successfully',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to resend invitation',
      );
    }
  }

  @Delete('invite/:inviteId')
  async cancelInvite(@Res() response, @Param('inviteId') inviteId: string) {
    try {
      await this.inviteService.cancelInvite(inviteId);
      return response.status(HttpStatus.OK).json({
        message: 'Invitation cancelled successfully',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to cancel invitation',
      );
    }
  }

  @Get('invite/:token')
  async getInviteDetails(@Res() response, @Param('token') token: string) {
    try {
      const invite = await this.inviteService.verifyInviteToken(token);
      return response.status(HttpStatus.OK).json({
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        role: invite.role,
        company: invite.company,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Invalid invitation token',
      );
    }
  }

  @ApiOperation({ summary: 'User logout - invalidates current token' })
  @Post('logout')
  async logout(@Res() response, @Headers() headers) {
    try {
      const token = headers.token?.toString();

      if (!token) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: 'No token provided for logout',
        });
      }

      // Invalidate token in Redis cache
      await this.redisService.invalidateToken(token);

      // Invalidate token in database (set status to inactive)
      await this.authService.invalidateToken(token);

      this.utility.log(
        `User logged out successfully: ${token.substring(0, 8)}...`,
      );

      return response.status(HttpStatus.OK).json({
        message: 'Logged out successfully',
      });
    } catch (err) {
      return this.utility.errorResponse(response, err, 'Failed to logout');
    }
  }

  @ApiOperation({
    summary: 'Logout from all devices - invalidates all user tokens',
  })
  @Post('logout-all')
  async logoutAll(@Res() response) {
    try {
      const accountId = this.utility.accountInformation.id;

      // Invalidate all tokens for this account in Redis
      await this.redisService.invalidateAllAccountTokens(accountId);

      // Invalidate all tokens for this account in database
      await this.authService.invalidateAllAccountTokens(accountId);

      this.utility.log(`User logged out from all devices: ${accountId}`);

      return response.status(HttpStatus.OK).json({
        message: 'Logged out from all devices successfully',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Failed to logout from all devices',
      );
    }
  }

}
