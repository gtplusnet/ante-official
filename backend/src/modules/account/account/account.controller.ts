import {
  Inject,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Res,
  Query,
  UsePipes,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  AccountGetDTO,
  AccountCreateDTO,
  AccountUpdateDTO,
  AccountDeleteDTO,
  ChangePasswordDTO,
} from './account.validator';
import { UpdateAccountDto, ChangePasswordDto } from './dto/update-account.dto';
import {
  LinkGoogleAccountDto,
  LinkFacebookAccountDto,
  SetPasswordDto,
} from './dto/auth-methods.dto';
import { AccountService } from './account.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { AuthService } from '../../auth/auth/auth.service';
import { InviteService } from '../../auth/auth/invite.service';
import { EnsureOneUserPerRoleHeadPipe } from '../../../pipes/unique-role-head.pipe.ts';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../../../types/multer';

@ApiTags('Account Management')
@ApiSecurity('custom-token')
@Controller('account')
export class AccountController {
  @Inject() public accountService: AccountService;
  @Inject() public utility: UtilityService;
  @Inject() public auth: AuthService;
  @Inject() public inviteService: InviteService;

  @ApiOperation({ summary: 'Change user password (admin)' })
  @ApiBody({ type: ChangePasswordDTO, description: 'User ID and new password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post('change-password')
  async changePassword(@Res() response, @Body() params: ChangePasswordDTO) {
    this.utility.responseHandler(
      this.accountService.changePassword(params),
      response,
    );
  }

  @ApiOperation({ summary: 'Upload and change profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (JPG, PNG, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @Post('change-profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async changeProfilePicture(
    @Res() response,
    @UploadedFile() file: MulterFile,
  ) {
    this.utility.responseHandler(
      this.accountService.changeProfilePicture(file),
      response,
    );
  }

  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture removed successfully',
  })
  @Delete('profile-picture')
  async removeProfilePicture(@Res() response) {
    // Pass null to remove the profile picture
    this.utility.responseHandler(
      this.accountService.changeProfilePicture(null as any),
      response,
    );
  }

  @ApiOperation({ summary: 'Get current user account information' })
  @Get('my_account')
  async myAccount(@Res() response) {
    this.utility.responseHandler(
      this.accountService.getAccountInformation({
        id: this.utility.accountInformation.id,
      }),
      response,
    );
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateAccountDto, description: 'Profile update data' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Patch('profile')
  async updateProfile(@Res() response, @Body() data: UpdateAccountDto) {
    this.utility.responseHandler(
      this.accountService.updateProfile(
        this.utility.accountInformation.id,
        data,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', description: 'Current password' },
        newPassword: { type: 'string', description: 'New password' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  @Post('change-user-password')
  async changeUserPassword(@Res() response, @Body() data: ChangePasswordDto) {
    this.utility.responseHandler(
      this.accountService.changeUserPassword(
        this.utility.accountInformation.id,
        data as any,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Get account information by ID' })
  @ApiQuery({ name: 'id', required: true, description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account information retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Get()
  async get(@Res() response, @Query() params: AccountGetDTO) {
    this.utility.responseHandler(
      this.accountService.getAccountInformation(params),
      response,
    );
  }

  @ApiOperation({ summary: 'Get accounts table with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiBody({
    description: 'Table filters and search criteria',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Accounts table data' })
  @Put()
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.accountService.accountTable(query, body),
      response,
    );
  }

  @ApiOperation({ summary: 'Create a new account' })
  @ApiBody({ type: AccountCreateDTO, description: 'Account creation data' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @UsePipes(EnsureOneUserPerRoleHeadPipe)
  @Post()
  async add(@Res() response, @Body() params: AccountCreateDTO) {
    this.utility.responseHandler(
      this.accountService.createAccount(params),
      response,
    );
  }

  @ApiOperation({ summary: 'Update an existing account' })
  @ApiBody({ type: AccountUpdateDTO, description: 'Account update data' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Patch()
  async update(@Res() response, @Body() params: AccountUpdateDTO) {
    this.utility.responseHandler(
      this.accountService.updateAccount(params),
      response,
    );
  }

  @ApiOperation({ summary: 'Delete an account' })
  @ApiQuery({ name: 'id', required: true, description: 'Account ID to delete' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Delete()
  async delete(@Res() response, @Query() params: AccountDeleteDTO) {
    this.utility.responseHandler(
      this.accountService.deleteUser(params),
      response,
    );
  }

  @ApiOperation({ summary: 'Restore a deleted account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Account ID to restore' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Account restored successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Post('restore')
  async restore(@Res() response, @Body() params: { id: string }) {
    this.utility.responseHandler(
      this.accountService.restoreUser(params.id),
      response,
    );
  }

  @ApiOperation({ summary: 'Search for assignable users' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'currentUserId',
    required: false,
    description: 'Current user ID to exclude',
  })
  @ApiResponse({ status: 200, description: 'List of assignable users' })
  @Get('search-assignees')
  async searchAssignee(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Query('currentUserId') currentUserId: string,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.accountService.searchAssignees(query, body, currentUserId),
      response,
    );
  }

  @ApiOperation({ summary: 'Search accounts by query' })
  @ApiQuery({
    name: 'searchQuery',
    required: true,
    description: 'Search term for name, email, or username',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @Get('search-account')
  async searchAccount(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Query('searchQuery') searchQuery: string,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.accountService.searchAccount(query, body, searchQuery),
      response,
    );
  }

  @ApiOperation({ summary: 'Get accounts that are not fully setup' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiBody({ description: 'Filter criteria', required: false })
  @ApiResponse({ status: 200, description: 'List of incomplete accounts' })
  @Put('not-setup')
  async accountsNotSetup(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.accountService.accountsNotSetupTable(query, body),
      response,
    );
  }

  @ApiOperation({ summary: 'Export all accounts to Excel file' })
  @ApiResponse({
    status: 200,
    description: 'Excel file with account data',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Get('export-accounts-to-excel')
  async exportAccountsToExcel(@Res() response) {
    const buffer = await this.accountService.exportAccountsToExcel();
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="accounts.xlsx"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  @ApiOperation({ summary: 'Get pending invitations' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  @Get('pending-invites')
  async getPendingInvites(@Res() response) {
    this.utility.responseHandler(
      this.inviteService.getPendingInvites(this.utility.companyId),
      response,
    );
  }

  @ApiOperation({ summary: 'Get pending invites table with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiBody({ description: 'Filter criteria', required: false })
  @ApiResponse({ status: 200, description: 'Paginated pending invites' })
  @Put('pending-invites')
  async pendingInvitesTable(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.accountService.pendingInvitesTable(query, body),
      response,
    );
  }

  // Auth Methods Management Endpoints
  @ApiOperation({ summary: 'Get authentication methods for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of enabled authentication methods',
    schema: {
      type: 'object',
      properties: {
        password: { type: 'boolean' },
        google: { type: 'boolean' },
        facebook: { type: 'boolean' },
      },
    },
  })
  @Get('auth-methods')
  async getAuthMethods(@Res() response) {
    this.utility.responseHandler(
      this.accountService.getAuthMethods(this.utility.accountInformation.id),
      response,
    );
  }

  @ApiOperation({ summary: 'Link Google account for authentication' })
  @ApiBody({ type: LinkGoogleAccountDto, description: 'Google OAuth token' })
  @ApiResponse({
    status: 200,
    description: 'Google account linked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid Google token' })
  @ApiResponse({
    status: 409,
    description: 'Google account already linked to another user',
  })
  @Post('link-google')
  async linkGoogleAccount(@Res() response, @Body() data: LinkGoogleAccountDto) {
    this.utility.responseHandler(
      this.accountService.linkGoogleAccount(
        this.utility.accountInformation.id,
        data,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Link Facebook account for authentication' })
  @ApiBody({
    type: LinkFacebookAccountDto,
    description: 'Facebook OAuth token',
  })
  @ApiResponse({
    status: 200,
    description: 'Facebook account linked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid Facebook token' })
  @ApiResponse({
    status: 409,
    description: 'Facebook account already linked to another user',
  })
  @Post('link-facebook')
  async linkFacebookAccount(
    @Res() response,
    @Body() data: LinkFacebookAccountDto,
  ) {
    this.utility.responseHandler(
      this.accountService.linkFacebookAccount(
        this.utility.accountInformation.id,
        data,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Set password for OAuth-only accounts' })
  @ApiBody({ type: SetPasswordDto, description: 'New password data' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({
    status: 400,
    description: 'Account already has password authentication',
  })
  @Post('set-password')
  async setPassword(@Res() response, @Body() data: SetPasswordDto) {
    this.utility.responseHandler(
      this.accountService.setPassword(this.utility.accountInformation.id, data),
      response,
    );
  }

  @ApiOperation({ summary: 'Unlink Google account authentication' })
  @ApiResponse({
    status: 200,
    description: 'Google account unlinked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot unlink only authentication method',
  })
  @Delete('unlink-google')
  async unlinkGoogleAccount(@Res() response) {
    this.utility.responseHandler(
      this.accountService.unlinkGoogleAccount(
        this.utility.accountInformation.id,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Unlink Facebook account authentication' })
  @ApiResponse({
    status: 200,
    description: 'Facebook account unlinked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot unlink only authentication method',
  })
  @Delete('unlink-facebook')
  async unlinkFacebookAccount(@Res() response) {
    this.utility.responseHandler(
      this.accountService.unlinkFacebookAccount(
        this.utility.accountInformation.id,
      ),
      response,
    );
  }

  @ApiOperation({ summary: 'Disable password authentication' })
  @ApiResponse({ status: 200, description: 'Password authentication disabled' })
  @ApiResponse({
    status: 400,
    description: 'Cannot disable only authentication method',
  })
  @Delete('disconnect-password')
  async disconnectPassword(@Res() response) {
    this.utility.responseHandler(
      this.accountService.disconnectPassword(
        this.utility.accountInformation.id,
      ),
      response,
    );
  }
}
