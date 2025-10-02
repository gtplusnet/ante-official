import { FieldType } from '../types/content-type';

export const getFieldComponent = (type: FieldType): string => {
  const componentMap: Record<FieldType, string> = {
    'text': 'CMSTextField',
    'richtext': 'CMSRichTextField',
    'number': 'CMSNumberField',
    'datetime': 'CMSDateTimeField',
    'boolean': 'CMSBooleanField',
    'media': 'CMSMediaField',
    'relation': 'CMSRelationField',
    'json': 'CMSJsonField',
    'uid': 'CMSUidField',
    'email': 'CMSEmailField',
    'password': 'CMSPasswordField',
    'enumeration': 'CMSEnumerationField',
    'component': 'CMSComponentField',
    'dynamiczone': 'CMSDynamicZoneField'
  };
  
  return componentMap[type] || 'CMSTextField';
};

export const getFieldClass = (field: any): string => {
  const classes = [];
  
  // Size classes
  const sizeClass = `field-size-${field.size || 'full'}`;
  classes.push(sizeClass);
  
  // Type classes
  classes.push(`field-type-${field.type}`);
  
  // State classes
  if (field.required) classes.push('field-required');
  if (field.disabled) classes.push('field-disabled');
  if (field.readonly) classes.push('field-readonly');
  
  return classes.join(' ');
};