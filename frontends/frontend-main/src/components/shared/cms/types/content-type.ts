export interface ContentType {
  id: string;
  name: string;
  displayName?: string;
  type: 'collection' | 'single' | 'component';
  singularName?: string;
  pluralName?: string;
  category?: string;
  icon?: string;
  description?: string;
  draftPublish?: boolean;
  internationalization?: boolean;
  fields: Field[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface Field {
  id: string | number;
  _id?: string;  // MongoDB ObjectId
  name: string;
  displayName?: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  private?: boolean;
  repeatable?: boolean;
  defaultValue?: any;
  size?: 'full' | 'two-thirds' | 'half' | 'third';
  
  // Validation
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  regex?: string;
  
  // Type-specific
  multiple?: boolean;
  numberType?: 'integer' | 'big integer' | 'decimal' | 'float';
  enumValues?: string[] | string;
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany' | 'oneWay' | 'manyWay';
  target?: string;
  targetContentType?: string;
  allowCreate?: boolean;
  allowedTypes?: string[];
  
  // Media-specific
  mediaType?: 'single' | 'multiple';
  allowedMediaTypes?: string[];
  
  // Component/Dynamic Zone
  componentId?: string;
  componentFields?: Field[];
  allowedComponents?: string[];
  
  // UI Configuration
  placeholder?: string;
  hint?: string;
  tooltip?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export type FieldType = 
  | 'text' 
  | 'richtext' 
  | 'number' 
  | 'datetime' 
  | 'boolean' 
  | 'media' 
  | 'relation' 
  | 'json' 
  | 'uid' 
  | 'email' 
  | 'password' 
  | 'enumeration' 
  | 'component' 
  | 'dynamiczone';

export interface FormMode {
  mode: 'preview' | 'create' | 'edit' | 'view';
  readonly?: boolean;
}