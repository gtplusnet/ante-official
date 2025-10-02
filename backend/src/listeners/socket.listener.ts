import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AccountUpdatedEvent,
  RoleUpdatedEvent,
} from '../events/account.events';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { PrismaService } from '@common/prisma.service';
import { RoleService } from '@modules/role/role/role.service';
import { CompanyService } from '@modules/company/company/company.service';

@Injectable()
export class SocketListener {
  constructor(
    @Inject() private socketService: SocketService,
    private prisma: PrismaService,
    @Inject() private roleService: RoleService,
    @Inject() private companyService: CompanyService,
  ) {}

  @OnEvent('account.updated')
  async handleAccountUpdated(event: AccountUpdatedEvent) {
    try {
      if (event.updateType === 'deactivation') {
        // Handle account deactivation
        this.socketService.emitToClients(
          [event.accountId],
          'account-deactivated',
          {
            accountId: event.accountId,
            timestamp: new Date().toISOString(),
            message:
              'Your account has been deactivated. You will be logged out.',
          },
        );
      } else if (event.updateType === 'password') {
        // Handle password change
        const message =
          event.changedBy === 'admin'
            ? 'Your password has been changed by an administrator. Please use your new password to log in.'
            : 'Your password has been successfully updated.';

        this.socketService.emitToClients(
          [event.accountId],
          'password-changed',
          {
            changedBy: event.changedBy || 'admin',
            timestamp: new Date().toISOString(),
            message,
          },
        );
      } else {
        // Handle general account updates
        // Get fresh account data
        const updatedAccount = await this.prisma.account.findUnique({
          where: { id: event.accountId },
        });

        if (updatedAccount && !updatedAccount.isDeleted) {
          // Format the account data properly with role and company information
          const formattedAccountData =
            await this.formatAccountData(updatedAccount);

          this.socketService.emitToClients(
            [event.accountId],
            'account-updated',
            {
              accountInformation: formattedAccountData,
              timestamp: new Date().toISOString(),
            },
          );
        }
      }
    } catch (error) {
      console.error('Error in account updated event handler:', error);
    }
  }

  @OnEvent('role.updated')
  async handleRoleUpdated(event: RoleUpdatedEvent) {
    try {
      // Get the updated role
      const role = await this.prisma.role.findUnique({
        where: { id: event.roleId },
      });

      if (!role) return;

      // Find all accounts with this role
      const accountsWithRole = await this.prisma.account.findMany({
        where: {
          roleId: event.roleId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

      if (accountsWithRole.length > 0) {
        const accountIds = accountsWithRole.map((account) => account.id);

        // Emit role-updated event to all affected users
        this.socketService.emitToClients(accountIds, 'role-updated', {
          roleId: event.roleId,
          role: role,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error in role updated event handler:', error);
    }
  }

  private async formatAccountData(accountInformation: any) {
    const role = await this.roleService.getRole({
      id: accountInformation.roleId,
    });

    const company = accountInformation.companyId
      ? await this.companyService.getInformation(accountInformation.companyId)
      : null;

    return {
      id: accountInformation.id,
      firstName: accountInformation.firstName,
      lastName: accountInformation.lastName,
      middleName: accountInformation.middleName,
      fullName: this.setFullName(accountInformation),
      contactNumber: accountInformation.contactNumber,
      email: accountInformation.email,
      status: accountInformation.status,
      username: accountInformation.username,
      image: accountInformation.image,
      roleID: accountInformation.roleId,
      role,
      company,
      parentAccountId: accountInformation.parentAccountId,
      companyId: accountInformation.companyId,
      createdAt: accountInformation.createdAt,
      updatedAt: accountInformation.updatedAt,
      isDeleted: accountInformation.isDeleted,
      isDeveloper: accountInformation.isDeveloper,
    };
  }

  private setFullName(accountInformation: any): string {
    const { firstName, middleName, lastName } = accountInformation;

    // Handle empty or null values
    if (!firstName && !middleName && !lastName) {
      return '';
    }

    // Capitalize first letter of each name part
    const capitalizedLastName = lastName
      ? lastName.charAt(0).toUpperCase() + lastName.slice(1)
      : '';
    const capitalizedFirstName = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
      : '';
    const capitalizedMiddleName = middleName
      ? middleName.charAt(0).toUpperCase() + middleName.slice(1)
      : '';

    // Format as "LastName, FirstName MiddleName" to match account.service.ts
    const fullName = `${capitalizedLastName}, ${capitalizedFirstName} ${capitalizedMiddleName}`;
    return fullName.trim();
  }
}
