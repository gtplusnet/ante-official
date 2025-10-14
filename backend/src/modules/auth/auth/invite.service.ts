import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmailService } from '@modules/communication/email/email.service';
import { EncryptionService } from '@common/encryption.service';
import { AccountService } from '@modules/account/account/account.service';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { Account, AccountInvite, Prisma, AuthProvider } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface SendInviteDto {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  parentAccountId?: string;
}

export interface AcceptInviteDto {
  token: string;
  username: string;
  password: string;
  contactNumber?: string;
  dateOfBirth?: Date;
}

export interface AcceptInviteWithGoogleDto {
  token: string;
  googleIdToken: string;
  contactNumber?: string;
  dateOfBirth?: Date;
}

export interface AcceptInviteWithFacebookDto {
  token: string;
  facebookAccessToken: string;
  contactNumber?: string;
  dateOfBirth?: Date;
}

@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
    private readonly accountService: AccountService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
  ) {}

  async sendInvite(
    sendInviteDto: SendInviteDto,
    invitedById: string,
    companyId: number,
  ): Promise<any> {
    const { email, firstName, lastName, roleId, parentAccountId } =
      sendInviteDto;

    // Check if email already exists in Account table
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('An account with this email already exists');
    }

    // Check if there's already a pending invite
    const existingInvite = await this.prisma.accountInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
        isAccepted: false,
      },
    });

    if (existingInvite) {
      // Check if invite is expired
      if (new Date() > existingInvite.inviteTokenExpiry) {
        // Delete expired invite
        await this.prisma.accountInvite.delete({
          where: { id: existingInvite.id },
        });
      } else {
        throw new ConflictException(
          'An invitation has already been sent to this email',
        );
      }
    }

    // Validate role exists
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        companyId,
      },
    });

    if (!role) {
      throw new NotFoundException('Invalid role ID');
    }

    // Level 0 roles should not have a parent
    if (role.level === 0 && parentAccountId) {
      throw new BadRequestException('Level 0 roles cannot have a parent user');
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date();
    inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7); // 7 days expiry

    // Create invite record
    const invite = await this.prisma.accountInvite.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        roleId,
        parentAccountId,
        inviteToken,
        inviteTokenExpiry,
        invitedById,
        companyId,
      },
      include: {
        invitedBy: true,
        role: true,
        company: true,
      },
    });

    // Create placeholder account with temporary credentials
    const tempUsername = `temp_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const tempPassword = randomBytes(16).toString('hex');

    const passwordEncryption =
      await this.encryptionService.encrypt(tempPassword);
    const encryptedPassword = passwordEncryption.encrypted;
    const encryptionKey = passwordEncryption.iv;

    const accountData: Prisma.AccountCreateInput = {
      username: tempUsername,
      firstName,
      lastName,
      contactNumber: '',
      email: email.toLowerCase(),
      password: encryptedPassword,
      key: encryptionKey,
      role: { connect: { id: roleId } },
      company: { connect: { id: companyId } },
      ...(parentAccountId
        ? { parent: { connect: { id: parentAccountId } } }
        : {}),
      isInviteAccepted: false,
      searchKeyword: `${firstName} ${lastName} ${email}`.toLowerCase(),
    };

    const placeholderAccount = await this.prisma.account.create({
      data: accountData,
    });

    // Update invite with account ID
    await this.prisma.accountInvite.update({
      where: { id: invite.id },
      data: { accountId: placeholderAccount.id },
    });

    // Send invitation email
    await this.sendInvitationEmail(invite);

    this.utility.log(`Invitation sent to ${email} for company ${companyId}`);

    return invite;
  }

  async verifyInviteToken(token: string): Promise<any> {
    console.log('verifyInviteToken - Token received:', token);
    console.log('verifyInviteToken - Token type:', typeof token);
    console.log('verifyInviteToken - Token length:', token?.length);

    const invite = await this.prisma.accountInvite.findFirst({
      where: {
        inviteToken: token,
        isAccepted: false,
      },
      include: {
        role: true,
        company: true,
        invitedBy: true,
      },
    });

    console.log(
      'verifyInviteToken - Query result:',
      invite ? 'Found' : 'Not found',
    );
    if (invite) {
      console.log('verifyInviteToken - Invite email:', invite.email);
    }

    if (!invite) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    // Check if token has expired
    if (new Date() > invite.inviteTokenExpiry) {
      throw new BadRequestException('Invitation token has expired');
    }

    return invite;
  }

  async acceptInvite(acceptInviteDto: AcceptInviteDto): Promise<Account> {
    const { token, username, password, contactNumber, dateOfBirth } =
      acceptInviteDto;

    // Verify token
    const invite = await this.verifyInviteToken(token);

    // Check if username already exists
    const existingUsername = await this.prisma.account.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Get the placeholder account
    if (!invite.accountId) {
      throw new BadRequestException(
        'Invalid invitation - no account associated',
      );
    }

    // Encrypt password
    const passwordEncryption = await this.encryptionService.encrypt(password);
    const encryptedPassword = passwordEncryption.encrypted;
    const encryptionKey = passwordEncryption.iv;

    // Update the placeholder account with real user data
    const updatedAccount = await this.prisma.account.update({
      where: { id: invite.accountId },
      data: {
        username: username.toLowerCase(),
        password: encryptedPassword,
        key: encryptionKey,
        contactNumber: contactNumber || '',
        dateOfBirth,
        isInviteAccepted: true,
        searchKeyword:
          `${invite.firstName} ${invite.lastName} ${invite.email} ${username}`.toLowerCase(),
      },
      include: {
        role: true,
        company: true,
      },
    });

    // Mark invite as accepted
    await this.prisma.accountInvite.update({
      where: { id: invite.id },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
      },
    });

    this.utility.log(`Invitation accepted by ${username} (${invite.email})`);

    return updatedAccount;
  }

  async acceptInviteWithGoogle(
    acceptInviteDto: AcceptInviteWithGoogleDto,
  ): Promise<Account> {
    const { token, googleIdToken, contactNumber, dateOfBirth } =
      acceptInviteDto;

    // Verify invitation token
    const invite = await this.verifyInviteToken(token);

    // Verify Google token
    const googleUser =
      await this.googleAuthService.verifyGoogleToken(googleIdToken);

    // No need to validate email - user can use any Google account
    // We'll use the invitation email for the account and save Google email separately

    // Check if a Google account already exists with this Google ID
    const existingGoogleAccount =
      await this.googleAuthService.findAccountByGoogleId(googleUser.sub);
    if (existingGoogleAccount) {
      throw new ConflictException(
        'This Google account is already linked to another user.',
      );
    }

    // Get the placeholder account
    if (!invite.accountId) {
      throw new BadRequestException(
        'Invalid invitation - no account associated',
      );
    }

    // Generate username from Google info
    const baseUsername =
      googleUser.given_name && googleUser.family_name
        ? `${googleUser.given_name}${googleUser.family_name}`
            .toLowerCase()
            .replace(/\s+/g, '')
        : googleUser.email.split('@')[0].toLowerCase();

    let username = baseUsername;
    let suffix = 1;

    // Ensure username is unique
    while (
      await this.prisma.account.findFirst({
        where: {
          username: username.toLowerCase(),
          id: { not: invite.accountId }, // Exclude the placeholder account
        },
      })
    ) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    // Update the placeholder account with Google authentication
    const updatedAccount = await this.prisma.account.update({
      where: { id: invite.accountId },
      data: {
        username: username.toLowerCase(),
        authProvider: AuthProvider.GOOGLE,
        googleId: googleUser.sub,
        googleEmail: googleUser.email, // Save Google email separately
        contactNumber: contactNumber || '',
        dateOfBirth,
        isInviteAccepted: true,
        isEmailVerified: true, // Google accounts are pre-verified
        // Keep the invitation names, not Google names
        firstName: invite.firstName,
        lastName: invite.lastName,
        searchKeyword:
          `${invite.firstName} ${invite.lastName} ${invite.email} ${username}`.toLowerCase(),
        // Remove password and key for Google accounts
        password: null,
        key: null,
      },
      include: {
        role: true,
        company: true,
      },
    });

    // Mark invite as accepted
    await this.prisma.accountInvite.update({
      where: { id: invite.id },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
      },
    });

    this.utility.log(
      `Invitation accepted via Google by ${username} (${invite.email})`,
    );

    return updatedAccount;
  }

  async acceptInviteWithFacebook(
    params: AcceptInviteWithFacebookDto,
  ): Promise<Account> {
    const { token, facebookAccessToken, contactNumber, dateOfBirth } = params;

    console.log('acceptInviteWithFacebook - Token:', token);
    console.log('acceptInviteWithFacebook - Token length:', token?.length);

    // Verify invite token
    const invite = await this.verifyInviteToken(token);
    console.log('acceptInviteWithFacebook - Invite found:', invite?.email);

    // Verify Facebook token
    const facebookUser =
      await this.facebookAuthService.verifyFacebookToken(facebookAccessToken);
    console.log(
      'acceptInviteWithFacebook - Facebook user:',
      facebookUser?.email,
    );

    // No need to validate email - user can use any Facebook account
    // We'll use the invitation email for the account and save Facebook email separately

    // Check if a Facebook account already exists with this Facebook ID
    const existingFacebookAccount =
      await this.facebookAuthService.findAccountByFacebookId(facebookUser.id);
    if (existingFacebookAccount) {
      throw new ConflictException(
        'This Facebook account is already linked to another user.',
      );
    }

    // Get the placeholder account
    if (!invite.accountId) {
      throw new BadRequestException(
        'Invalid invitation - no account associated',
      );
    }

    // Generate username from Facebook info
    const baseUsername =
      facebookUser.first_name && facebookUser.last_name
        ? `${facebookUser.first_name}${facebookUser.last_name}`
            .toLowerCase()
            .replace(/\s+/g, '')
        : facebookUser.email.split('@')[0].toLowerCase();

    let username = baseUsername;
    let suffix = 1;

    // Ensure username is unique
    while (
      await this.prisma.account.findFirst({
        where: {
          username: username.toLowerCase(),
          id: { not: invite.accountId }, // Exclude the placeholder account
        },
      })
    ) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    // Update the placeholder account with Facebook authentication
    const updatedAccount = await this.prisma.account.update({
      where: { id: invite.accountId },
      data: {
        username: username.toLowerCase(),
        authProvider: AuthProvider.FACEBOOK,
        facebookId: facebookUser.id,
        facebookEmail: facebookUser.email, // Save Facebook email separately
        contactNumber: contactNumber || '',
        dateOfBirth,
        isInviteAccepted: true,
        isEmailVerified: true, // Facebook accounts have verified emails
        // Keep the invitation names, not Facebook names
        firstName: invite.firstName,
        lastName: invite.lastName,
        searchKeyword:
          `${invite.firstName} ${invite.lastName} ${invite.email} ${username}`.toLowerCase(),
        // Remove password and key for Facebook accounts
        password: null,
        key: null,
      },
      include: {
        role: true,
        company: true,
      },
    });

    // Mark invite as accepted
    await this.prisma.accountInvite.update({
      where: { id: invite.id },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
      },
    });

    this.utility.log(
      `Invitation accepted via Facebook by ${username} (${invite.email})`,
    );

    return updatedAccount;
  }

  async resendInvite(inviteId: string): Promise<void> {
    const invite = await this.prisma.accountInvite.findUnique({
      where: { id: inviteId },
      include: {
        invitedBy: true,
        role: true,
        company: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.isAccepted) {
      throw new BadRequestException(
        'This invitation has already been accepted',
      );
    }

    // Generate new token and expiry
    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date();
    inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7);

    // Update invite with new token
    await this.prisma.accountInvite.update({
      where: { id: inviteId },
      data: {
        inviteToken,
        inviteTokenExpiry,
      },
    });

    // Send email again
    const updatedInvite = { ...invite, inviteToken, inviteTokenExpiry };
    await this.sendInvitationEmail(updatedInvite);

    this.utility.log(`Invitation resent to ${invite.email}`);
  }

  async cancelInvite(inviteId: string, cancelledBy?: string): Promise<void> {
    const invite = await this.prisma.accountInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.isAccepted) {
      throw new BadRequestException('Cannot cancel an accepted invitation');
    }

    // Get cancelledBy account details if provided
    let cancelledByUsername = null;
    if (cancelledBy) {
      const cancelledByAccount = await this.prisma.account.findUnique({
        where: { id: cancelledBy },
        select: { username: true },
      });
      cancelledByUsername = cancelledByAccount?.username;
    }

    // Get account details before deletion for audit log
    let accountToDelete = null;
    if (invite.accountId) {
      accountToDelete = await this.prisma.account.findUnique({
        where: { id: invite.accountId },
        select: {
          id: true,
          username: true,
          email: true,
          accountType: true,
          roleId: true,
          companyId: true,
        },
      });

      // Create audit log before deletion
      if (accountToDelete) {
        await this.prisma.accountDeletionLog.create({
          data: {
            deletedAccountId: accountToDelete.id,
            deletedUsername: accountToDelete.username,
            deletedEmail: accountToDelete.email,
            deletedByAccountId: cancelledBy,
            deletedByUsername: cancelledByUsername,
            reason: 'Invitation cancelled - placeholder account removed',
            deletionType: 'hard',
            metadata: {
              inviteId: invite.id,
              accountType: accountToDelete.accountType,
              roleId: accountToDelete.roleId,
              companyId: accountToDelete.companyId,
              isPlaceholderAccount: true,
            },
          },
        });
      }
    }

    // Delete the invite and associated placeholder account in a transaction
    await this.prisma.$transaction(async (tx) => {
      if (invite.accountId) {
        await tx.account.delete({
          where: { id: invite.accountId },
        });
      }
      await tx.accountInvite.delete({
        where: { id: inviteId },
      });
    });

    this.utility.log(`Invitation cancelled for ${invite.email}`);
  }

  async getPendingInvites(companyId: number): Promise<AccountInvite[]> {
    return this.prisma.accountInvite.findMany({
      where: {
        companyId,
        isAccepted: false,
      },
      include: {
        role: true,
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async sendInvitationEmail(invite: any): Promise<void> {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:9000'}/#/invite/${invite.inviteToken}`;

    const emailContent = {
      to: invite.email,
      subject: `You're invited to join ${invite.company.companyName} on GEER-ANTE ERP`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to GEER-ANTE ERP</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2F40C4;
              margin: 0;
              font-size: 28px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .join-button {
              display: inline-block;
              background-color: #2F40C4;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
            }
            .join-button:hover {
              background-color: #1e2d8f;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #2F40C4;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            ul {
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GEER-ANTE ERP</h1>
              <p>Business Management System</p>
            </div>
            
            <div class="content">
              <p>Hello ${invite.firstName} ${invite.lastName},</p>
              
              <p><strong>${invite.invitedBy.firstName} ${invite.invitedBy.lastName}</strong> has invited you to join <strong>${invite.company.companyName}</strong> as a <strong>${invite.role.name}</strong>.</p>
              
              <div class="button-container">
                <a href="${inviteUrl}" class="join-button">Join Now</a>
              </div>
              
              <div class="info-box">
                <h3>What happens next?</h3>
                <ol>
                  <li>Click the "Join Now" button above</li>
                  <li>Create your username and password</li>
                  <li>Add your contact details (optional)</li>
                  <li>Start using GEER-ANTE ERP with your team</li>
                </ol>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This invitation will expire in 7 days</li>
                <li>The invitation link can only be used once</li>
                <li>If you need a new invitation, please contact ${invite.invitedBy.firstName}</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>This is an automated message from GEER-ANTE ERP. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} GEER-ANTE ERP. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.emailService.sendEmail(invite.invitedById, emailContent, {
        module: 'USER_MANAGEMENT',
        moduleContext: 'INVITATION',
        metadata: {
          inviteId: invite.id,
          invitedEmail: invite.email,
          role: invite.role.name,
        },
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      this.utility.log(
        `Failed to send invitation email to ${invite.email}: ${error.message}`,
      );
      // Don't throw - we don't want invite creation to fail if email fails
    }
  }
}
