import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'validUsername', async: false })
export class ValidUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;

    // Check if string contains no spaces
    return !value.includes(' ');
  }

  defaultMessage(): string {
    return 'Username must not contain spaces.';
  }
}

export function ValidUsername(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidUsernameConstraint,
    });
  };
}
