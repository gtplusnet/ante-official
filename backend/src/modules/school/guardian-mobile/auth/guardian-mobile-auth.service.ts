import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma.service';
import { EncryptionService } from '@common/encryption.service';
import { UtilityService } from '@common/utility.service';
import { SupabaseAuthService } from '@modules/auth/supabase-auth/supabase-auth.service';
import * as bcrypt from 'bcrypt';
import { Guardian } from '@prisma/client';
import {
  GuardianLoginDto,
  GuardianRegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ChangePasswordDto,
  LogoutDto,
} from './guardian-mobile-auth.dto';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: number;
  type: 'guardian';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class GuardianMobileAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly utilityService: UtilityService,
    @Inject(SupabaseAuthService)
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async login(
    dto: GuardianLoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Build where clause - if companyId provided, use it; otherwise just use email
    const whereClause: any = {
      email: dto.email,
      isActive: true,
      isDeleted: false,
    };

    if (dto.companyId) {
      whereClause.companyId = dto.companyId;
    }

    const guardian = await this.prisma.guardian.findFirst({
      where: whereClause,
      include: {
        company: true,
      },
    });

    if (!guardian) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password - check bcrypt first, then fall back to decryption
    let isPasswordValid = false;

    // First try bcrypt (for migrated/new accounts)
    // Commented until migration is run
    // if (guardian.passwordHash) {
    //   isPasswordValid = await bcrypt.compare(dto.password, guardian.passwordHash);
    // }

    // Fall back to decryption for legacy accounts
    if (!isPasswordValid && guardian.password && guardian.key) {
      const decryptedPassword = await this.encryptionService.decrypt(
        guardian.password,
        guardian.key,
      );
      isPasswordValid = decryptedPassword === dto.password;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(guardian);

    // Save token to database
    await this.saveToken(
      guardian.id,
      tokens,
      dto.deviceId,
      dto.deviceInfo,
      ipAddress,
      userAgent,
    );

    // Update last login
    await this.prisma.guardian.update({
      where: { id: guardian.id },
      data: {
        lastLogin: new Date(),
        lastAppLogin: new Date(),
        appVersion: dto.deviceInfo
          ? JSON.parse(dto.deviceInfo).appVersion
          : null,
      },
    });

    // Get connected students
    const students = await this.prisma.studentGuardian.findMany({
      where: { guardianId: guardian.id },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
      },
    });

    // Generate Supabase tokens
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};

    try {
      // Create a pseudo-account for the guardian to get Supabase tokens
      // Use guardian-specific email format to avoid conflicts with regular accounts
      const guardianAccount = {
        id: guardian.id,
        email: `guardian.${guardian.email}`, // Prefix with 'guardian.' for Guardian App users
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        companyId: guardian.companyId,
        roleId: 'guardian', // Use 'guardian' as a special roleId for guardians
        supabaseUserId: null, // Guardians don't have pre-existing Supabase IDs
      };

      const supabaseResult = await this.supabaseAuthService.ensureSupabaseUser(
        guardianAccount as any,
        dto.password, // Only used for first-time creation
      );

      if (supabaseResult?.accessToken) {
        supabaseTokens = {
          supabaseToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        };
      }
    } catch (error) {
      // Log but don't fail login if Supabase integration fails
      this.utilityService.log(
        `Supabase integration failed for guardian ${guardian.email}: ${error.message}`,
      );
    }

    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: guardian.middleName,
        contactNumber: guardian.contactNumber,
        students: students.map((sg) => ({
          ...sg.student,
          relationship: sg.relationship,
          isPrimary: sg.isPrimary,
        })),
      },
      tokens: {
        ...tokens,
        ...supabaseTokens,
      },
      company: {
        id: guardian.company.id,
        name: guardian.company.companyName,
      },
    };
  }

  async register(
    dto: GuardianRegisterDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Check if email already exists in the entire system
    const existingGuardian = await this.prisma.guardian.findFirst({
      where: {
        email: dto.email,
        isDeleted: false,
      },
    });

    if (existingGuardian) {
      throw new ConflictException('Email already registered in the system');
    }

    // Verify company exists
    const company = await this.prisma.company.findFirst({
      where: {
        id: dto.companyId,
      },
    });

    if (!company) {
      throw new BadRequestException('Invalid company');
    }

    // Encrypt password
    // Hash password with bcrypt for new accounts
    const saltRounds = 10;
    const _passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Keep legacy encryption for backward compatibility
    const passwordEncryption = await this.encryptionService.encrypt(
      dto.password,
    );

    // Create guardian with company relation
    const guardian = await this.prisma.guardian.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        dateOfBirth: new Date(dto.dateOfBirth),
        email: dto.email,
        password: passwordEncryption.encrypted,
        key: passwordEncryption.iv,
        // passwordHash will be added after migration
        // passwordHash: passwordHash,
        contactNumber: dto.contactNumber,
        alternateNumber: dto.alternateNumber,
        address: dto.address,
        occupation: dto.occupation,
        searchKeyword: this.generateSearchKeyword(dto),
        companyId: dto.companyId,
        lastAppLogin: new Date(),
      },
      include: {
        company: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(guardian);

    // Save token to database
    await this.saveToken(
      guardian.id,
      tokens,
      dto.deviceId,
      null,
      ipAddress,
      userAgent,
    );

    // Get company info for response
    const companyInfo = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    // Generate Supabase tokens for new registration
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};

    try {
      // Use guardian-specific email format to avoid conflicts with regular accounts
      const guardianAccount = {
        id: guardian.id,
        email: `guardian.${guardian.email}`, // Prefix with 'guardian.' for Guardian App users
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        companyId: guardian.companyId,
        roleId: 'guardian', // Use 'guardian' as a special roleId for guardians
        supabaseUserId: null, // Guardians don't have pre-existing Supabase IDs
      };

      const supabaseResult = await this.supabaseAuthService.ensureSupabaseUser(
        guardianAccount as any,
        dto.password,
      );

      if (supabaseResult?.accessToken) {
        supabaseTokens = {
          supabaseToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        };
      }
    } catch (error) {
      this.utilityService.log(
        `Supabase integration failed for new guardian ${guardian.email}: ${error.message}`,
      );
    }

    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: guardian.middleName,
        contactNumber: guardian.contactNumber,
        students: [], // New registration has no students yet
      },
      tokens: {
        ...tokens,
        ...supabaseTokens,
      },
      company: companyInfo
        ? {
            id: companyInfo.id,
            name: companyInfo.companyName,
          }
        : null,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenRecord = await this.prisma.guardianToken.findFirst({
      where: {
        refreshToken: dto.refreshToken,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        guardian: true,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.guardian);

    // Update token record
    await this.prisma.guardianToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: addDays(new Date(), 30),
      },
    });

    return tokens;
  }

  async logout(guardianId: string, dto: LogoutDto): Promise<void> {
    const whereClause: any = {
      guardianId,
      isRevoked: false,
    };

    if (dto.refreshToken) {
      whereClause.refreshToken = dto.refreshToken;
    }

    if (dto.deviceId) {
      whereClause.deviceId = dto.deviceId;
    }

    // Revoke tokens
    await this.prisma.guardianToken.updateMany({
      where: whereClause,
      data: {
        isRevoked: true,
      },
    });
  }

  async forgotPassword(_dto: ForgotPasswordDto): Promise<{ message: string }> {
    // TODO: Implement password reset for guardians
    // This requires either:
    // 1. Updating the OTPVerification model to support guardians
    // 2. Creating a separate password reset token system for guardians
    // 3. Using the existing email system to send reset links

    return {
      message:
        'Password reset functionality is not yet available. Please contact support.',
    };
  }

  async resetPassword(_dto: ResetPasswordDto): Promise<{ message: string }> {
    // TODO: Implement password reset for guardians
    // This method should verify the reset token and update the password
    // The current OTPVerification model doesn't support guardian accounts
    // and doesn't have isUsed/usedAt fields
    throw new BadRequestException(
      'Password reset functionality is not yet available',
    );
  }

  async changePassword(
    guardianId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Verify current password
    const decryptedPassword = await this.encryptionService.decrypt(
      guardian.password,
      guardian.key,
    );

    if (decryptedPassword !== dto.currentPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Encrypt new password
    // Hash password with bcrypt
    const saltRounds = 10;
    const _passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Keep legacy encryption for backward compatibility
    const passwordEncryption = await this.encryptionService.encrypt(
      dto.newPassword,
    );

    // Update password
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        password: passwordEncryption.encrypted,
        key: passwordEncryption.iv,
        // passwordHash will be added after migration
        // passwordHash: passwordHash,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async verifyOtp(_dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    // TODO: Implement OTP verification for guardians
    // This requires updating the OTPVerification model to support guardians
    // or creating a separate GuardianOTPVerification model
    throw new BadRequestException(
      'OTP verification not yet implemented for guardians',
    );
  }

  async validateGuardian(id: string): Promise<Guardian> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new UnauthorizedException('Invalid guardian');
    }

    return guardian;
  }

  private async generateTokens(guardian: Guardian): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: guardian.id,
      email: guardian.email,
      companyId: guardian.companyId,
      type: 'guardian',
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private async saveToken(
    guardianId: string,
    tokens: AuthTokens,
    deviceId?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = addDays(new Date(), 30); // Refresh token expires in 30 days

    await this.prisma.guardianToken.create({
      data: {
        guardianId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceId,
        deviceInfo: deviceInfo ? JSON.parse(deviceInfo) : null,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  private generateSearchKeyword(dto: GuardianRegisterDto): string {
    const parts = [
      dto.firstName,
      dto.lastName,
      dto.middleName,
      dto.email,
      dto.contactNumber,
    ].filter(Boolean);
    return parts.join(' ').toLowerCase();
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async getProfile(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                middleName: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        middleName: guardian.middleName,
        contactNumber: guardian.contactNumber,
        alternateNumber: guardian.alternateNumber,
        address: guardian.address,
        occupation: guardian.occupation,
        lastLogin: guardian.lastLogin,
        students: guardian.students.map((sg) => ({
          id: sg.student.id,
          studentNumber: sg.student.studentNumber,
          firstName: sg.student.firstName,
          lastName: sg.student.lastName,
          middleName: sg.student.middleName,
          relationship: sg.relationship,
          isPrimary: sg.isPrimary,
        })),
      },
      company: {
        id: guardian.company.id,
        name: guardian.company.companyName,
      },
    };
  }
}
