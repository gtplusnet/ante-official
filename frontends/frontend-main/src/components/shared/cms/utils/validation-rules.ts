import { Field } from '../types/content-type';

export const getValidationRules = (field: Field): Array<(val: any) => boolean | string> => {
  const rules: Array<(val: any) => boolean | string> = [];
  
  // Required field validation
  if (field.required) {
    rules.push((val: any) => {
      if (Array.isArray(val)) {
        return val.length > 0 || `${field.displayName || field.name} is required`;
      }
      if (typeof val === 'boolean') {
        return true; // Boolean fields are always valid
      }
      return !!val || `${field.displayName || field.name} is required`;
    });
  }
  
  // String length validation
  if (field.maxLength) {
    rules.push((val: string) => 
      !val || val.length <= field.maxLength! || `Maximum ${field.maxLength} characters allowed`
    );
  }
  
  if (field.minLength) {
    rules.push((val: string) => 
      !val || val.length >= field.minLength! || `Minimum ${field.minLength} characters required`
    );
  }
  
  // Number validation
  if (field.type === 'number') {
    if (field.min !== undefined) {
      rules.push((val: number) => 
        val === null || val === undefined || val >= field.min! || `Minimum value is ${field.min}`
      );
    }
    
    if (field.max !== undefined) {
      rules.push((val: number) => 
        val === null || val === undefined || val <= field.max! || `Maximum value is ${field.max}`
      );
    }
    
    if (field.numberType === 'integer' || field.numberType === 'big integer') {
      rules.push((val: number) => 
        val === null || val === undefined || Number.isInteger(val) || 'Must be an integer'
      );
    }
  }
  
  // Email validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    rules.push((val: string) => 
      !val || emailRegex.test(val) || 'Invalid email address'
    );
  }
  
  // Custom regex validation
  if (field.regex) {
    try {
      const regex = new RegExp(field.regex);
      rules.push((val: string) => 
        !val || regex.test(val) || `Value must match pattern: ${field.regex}`
      );
    } catch (e) {
      console.warn(`Invalid regex pattern for field ${field.name}: ${field.regex}`);
    }
  }
  
  // JSON validation
  if (field.type === 'json') {
    rules.push((val: string) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return 'Must be valid JSON';
      }
    });
  }
  
  return rules;
};