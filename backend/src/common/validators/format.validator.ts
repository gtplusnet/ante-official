import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'validFormat', async: false })
export class ValidFormatConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;

    // Check if string contains only lowercase letters and dots
    const validFormat = /^[a-z.]+$/;
    return validFormat.test(value);
  }

  defaultMessage(): string {
    return 'Value must contain only lowercase letters and dots, with no spaces or other symbols.';
  }
}

export function ValidFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidFormatConstraint,
    });
  };
}
