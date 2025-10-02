import { Field } from '../types/content-type';

export const generateMockData = (field: Field): any => {
  // Use default value if provided
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  
  // Generate based on field type
  switch (field.type) {
    case 'text':
      return `Sample ${field.displayName || field.name}`;
      
    case 'richtext':
      return `<p>This is sample rich text content for <strong>${field.displayName || field.name}</strong>.</p>
              <p>It can contain <em>formatted text</em>, lists, and more.</p>`;
      
    case 'number':
      if (field.numberType === 'float' || field.numberType === 'decimal') {
        return 99.99;
      }
      return 42;
      
    case 'email':
      return 'user@example.com';
      
    case 'password':
      return '••••••••';
      
    case 'uid':
      return 'sample-unique-identifier-123';
      
    case 'datetime':
      return new Date().toISOString();
      
    case 'boolean':
      return false;
      
    case 'enumeration':
      if (field.enumValues) {
        const values = typeof field.enumValues === 'string' 
          ? field.enumValues.split('\n').filter(v => v.trim())
          : field.enumValues;
        return values[0] || 'Option 1';
      }
      return 'Option 1';
      
    case 'relation':
      const targetName = field.targetContentType || 'Related';
      if (field.relationType === 'manyToMany' || field.relationType === 'oneToMany') {
        return [`${targetName} Item 1`, `${targetName} Item 2`];
      }
      return `${targetName} Item 1`;
      
    case 'json':
      return JSON.stringify({
        example: 'data',
        nested: {
          key: 'value'
        }
      }, null, 2);
      
    case 'media':
      return {
        id: 1,
        name: 'sample-image.jpg',
        url: '/placeholder-image.jpg',
        mime: 'image/jpeg',
        size: 1024
      };
      
    case 'component':
      return {
        id: field.componentId,
        data: {}
      };
      
    case 'dynamiczone':
      return [];
      
    default:
      return '';
  }
};

export const generateFormData = (fields: Field[]): Record<string, any> => {
  const data: Record<string, any> = {};
  
  fields.forEach(field => {
    data[field.name] = generateMockData(field);
  });
  
  return data;
};