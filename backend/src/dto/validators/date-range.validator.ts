import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateGreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          // Handle null/undefined values
          if (value == null || relatedValue == null) {
            return false;
          }

          // Handle string numbers (timestamps)
          let dateValue: Date;
          let relatedDateValue: Date;

          if (typeof value === 'string' && /^\d+$/.test(value)) {
            dateValue = new Date(parseInt(value, 10));
          } else {
            dateValue = new Date(value);
          }

          if (typeof relatedValue === 'string' && /^\d+$/.test(relatedValue)) {
            relatedDateValue = new Date(parseInt(relatedValue, 10));
          } else {
            relatedDateValue = new Date(relatedValue);
          }

          // Check if dates are valid
          if (isNaN(dateValue.getTime()) || isNaN(relatedDateValue.getTime())) {
            return false;
          }

          return dateValue > relatedDateValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be greater than ${relatedPropertyName}`;
        },
      },
    });
  };
}
