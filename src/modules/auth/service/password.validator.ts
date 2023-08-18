import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'password', async: false })
export class PasswordValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      return false;
    }

    // Check minimum length is 6
    if (value.length < 6) {
      return false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      return false;
    }

    // Check for at least one digit
    if (!/\d/.test(value)) {
      return false;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()\-=_+[\]{};':"\\|,.<>/?]/.test(value)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: PasswordValidator,
    });
  };
}
