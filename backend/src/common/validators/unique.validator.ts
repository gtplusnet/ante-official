import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UtilityService } from '../utility.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
  @Inject() private prisma: PrismaService;

  async validate(value: any, args: any): Promise<boolean> {
    const [entity, field] = args.constraints;

    //Check if the record exists in the database
    const record = await (this.prisma as any)[entity].findUnique({
      where: { [field]: value },
    });

    return !record;
  }

  defaultMessage(args: any): string {
    const [entity, field] = args.constraints;
    return `${field} already exists in ${entity}`;
  }
}

export function Unique(
  entity: string,
  field: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entity, field],
      validator: UniqueConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class EmployeeCodeUniquePerCompanyConstraint
  implements ValidatorConstraintInterface
{
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;

  async validate(employeeCode: any, args: any): Promise<boolean> {
    const object = args.object;
    const companyId = this.utilityService.companyId;
    const accountId = object.accountId; // Only present on update
    if (!employeeCode || !companyId) return false;

    // Find employee with same code in the same company
    const employee = await this.prisma.employeeData.findFirst({
      where: {
        employeeCode,
        account: { companyId },
      },
      include: { account: true },
    });

    // If no such employee, it's unique
    if (!employee) return true;
    // If updating, allow if it's the same account
    if (accountId && employee.accountId === accountId) return true;
    // Otherwise, not unique
    return false;
  }

  defaultMessage(): string {
    return 'Employee code must be unique within the company.';
  }
}

export function IsEmployeeCodeUniquePerCompany(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: EmployeeCodeUniquePerCompanyConstraint,
    });
  };
}
