import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class ExistsConstraint implements ValidatorConstraintInterface {
  @Inject() private prisma: PrismaService;

  async validate(value: any, args: any): Promise<boolean> {
    const [entity, field] = args.constraints;

    //Check if the record exists in the database

    if (!entity || !field || !value) {
      return false;
    } else {
      const record = await (this.prisma as any)[entity].findUnique({
        where: { [field]: Number(value) >= 0 ? Number(value) : value },
      });

      return !!record;
    }
  }

  defaultMessage(args: any): string {
    const [entity, field] = args.constraints;
    return `${field} does not exist in ${entity}`;
  }
}

export function Exists(
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
      validator: ExistsConstraint,
    });
  };
}
