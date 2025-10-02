import { ref } from 'vue';
import type { Field, FieldType } from '@components/shared/cms/types/content-type';
import { useQuasar } from 'quasar';

export interface FieldTypeDefinition {
  type: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export function useFieldManagement() {
  const $q = useQuasar();

  // All field types
  const allFieldTypes = ref<FieldTypeDefinition[]>([
    { type: 'text', name: 'Text', icon: 'o_text_fields', color: '#1976d2', description: 'Small or long text' },
    { type: 'richtext', name: 'Rich Text', icon: 'o_notes', color: '#9c27b0', description: 'Text with formatting' },
    { type: 'number', name: 'Number', icon: 'o_numbers', color: '#4caf50', description: 'Integer, float, decimal' },
    { type: 'datetime', name: 'Date/Time', icon: 'o_calendar_today', color: '#ff9800', description: 'Date and time picker' },
    { type: 'boolean', name: 'Boolean', icon: 'o_toggle_on', color: '#e91e63', description: 'Yes/No switch' },
    { type: 'media', name: 'Media', icon: 'o_image', color: '#00bcd4', description: 'Files and images' },
    { type: 'relation', name: 'Relation', icon: 'o_share', color: '#ff5722', description: 'Link to other types' },
    { type: 'json', name: 'JSON', icon: 'o_code', color: '#607d8b', description: 'JSON object or array' },
    { type: 'uid', name: 'UID', icon: 'o_fingerprint', color: '#ffc107', description: 'Unique identifier' },
    { type: 'email', name: 'Email', icon: 'o_email', color: '#f44336', description: 'Email address' },
    { type: 'password', name: 'Password', icon: 'o_lock', color: '#3f51b5', description: 'Password field' },
    { type: 'enumeration', name: 'Enumeration', icon: 'o_list', color: '#009688', description: 'List of options' },
    { type: 'component', name: 'Component', icon: 'o_widgets', color: '#673ab7', description: 'Reusable group' },
    { type: 'dynamiczone', name: 'Dynamic Zone', icon: 'o_dashboard_customize', color: '#795548', description: 'Dynamic components' },
  ]);

  // Drag state
  const isDragging = ref(false);
  const draggedItem = ref<Field | null>(null);

  // Get field type metadata
  const getFieldIcon = (type: string) => {
    const fieldType = allFieldTypes.value.find(ft => ft.type === type);
    return fieldType ? fieldType.icon : 'o_help';
  };

  const getFieldColor = (type: string) => {
    const fieldType = allFieldTypes.value.find(ft => ft.type === type);
    return fieldType ? fieldType.color : '#666';
  };

  const getFieldTypeLabel = (type: string) => {
    const fieldType = allFieldTypes.value.find(ft => ft.type === type);
    return fieldType ? fieldType.name : type;
  };

  // Create a new field
  const createField = (data?: Partial<Field>): Field => {
    return {
      id: data?.id || Date.now().toString(),
      name: data?.name || '',
      displayName: data?.displayName || '',
      type: data?.type || 'text' as FieldType,
      required: data?.required || false,
      unique: data?.unique || false,
      private: data?.private || false,
      defaultValue: data?.defaultValue || '',
      size: data?.size || 'full',
      ...data
    };
  };

  // Validate field
  const validateField = (field: Field): string[] => {
    const errors: string[] = [];

    if (!field.name) {
      errors.push('Field name is required');
    } else if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
      errors.push('Field name must start with lowercase letter, no spaces');
    }

    if (!field.type) {
      errors.push('Field type is required');
    }

    // Type-specific validation
    if (field.type === 'enumeration' && !field.enumValues) {
      errors.push('Enumeration values are required');
    }

    if (field.type === 'relation' && !field.targetContentType) {
      errors.push('Target content type is required for relation');
    }

    return errors;
  };

  // Drag and drop handlers
  const onDragStart = (event: any) => {
    isDragging.value = true;
    const fieldId = event.item?.dataset?.fieldId;
    if (fieldId) {
      draggedItem.value = { id: fieldId } as Field;
    }
    document.body.style.cursor = 'grabbing';
  };

  const onDragEnd = (event: any) => {
    setTimeout(() => {
      const fieldId = event.item?.dataset?.fieldId;
      if (fieldId) {
        const element = document.querySelector(`[data-field-id="${fieldId}"]`);
        element?.classList.add('drop-animation');
        
        setTimeout(() => {
          element?.classList.remove('drop-animation');
        }, 300);
      }
      
      isDragging.value = false;
      draggedItem.value = null;
      document.body.style.cursor = '';
    }, 50);
  };

  // Set field size with animation
  const setFieldSize = (field: Field, size: 'full' | 'half' | 'third', callback?: () => void) => {
    if (field.size !== size) {
      const element = document.querySelector(`[data-field-id="${field.id}"]`) as HTMLElement;
      
      if (element) {
        element.classList.add('size-changing');
      }
      
      field.size = size;
      
      if (callback) {
        callback();
      }
      
      setTimeout(() => {
        element?.classList.remove('size-changing');
      }, 400);
    }
  };

  // Delete field with confirmation
  const deleteFieldWithConfirm = (field: Field, onConfirm: () => void) => {
    $q.dialog({
      title: 'Delete Field',
      message: `Are you sure you want to delete the field "${field.name}"? This action cannot be undone.`,
      cancel: true,
      persistent: true,
    }).onOk(onConfirm);
  };

  // Get field mock value for preview
  const getFieldMockValue = (field: Field) => {
    switch (field.type) {
      case 'text':
        return field.defaultValue || `Sample ${field.name}`;
      case 'richtext':
        return field.defaultValue || `<p>Rich text content for ${field.name}</p>`;
      case 'number':
        return field.defaultValue || 42;
      case 'email':
        return field.defaultValue || 'user@example.com';
      case 'password':
        return '••••••••';
      case 'uid':
        return field.defaultValue || 'sample-unique-identifier';
      case 'datetime':
        return new Date().toLocaleString();
      case 'boolean':
        return field.defaultValue || false;
      case 'enumeration':
        let options: string[] = [];
        if (typeof field.enumValues === 'string') {
          options = field.enumValues.split('\n').filter((v: string) => v.trim());
        } else if (Array.isArray(field.enumValues)) {
          options = field.enumValues;
        }
        return options[0] || 'Option 1';
      case 'relation':
        if (field.relationType === 'manyToMany' || field.relationType === 'oneToMany') {
          return [`${field.targetContentType || 'Related'} Item 1`];
        }
        return `${field.targetContentType || 'Related'} Item 1`;
      case 'json':
        return field.defaultValue || JSON.stringify({ example: 'data' }, null, 2);
      case 'media':
        if (field.mediaType === 'multiple') {
          return [
            { id: '1', name: 'sample-image.jpg', url: '/placeholder-image.jpg', type: 'image/jpeg', size: 1024000 },
            { id: '2', name: 'sample-document.pdf', url: '/placeholder-doc.pdf', type: 'application/pdf', size: 2048000 }
          ];
        }
        return { id: '1', name: 'sample-media.jpg', url: '/placeholder.jpg', type: 'image/jpeg', size: 512000 };
      case 'component':
        return 'component';
      case 'dynamiczone':
        return 'dynamiczone';
      default:
        return field.defaultValue || '';
    }
  };

  // Get field component props for preview
  const getFieldProps = (field: Field) => {
    const baseProps: any = {
      label: field.displayName || field.name,
      outlined: true,
      dense: true,
      class: 'preview-field',
    };

    if (field.required) {
      baseProps.label += ' *';
      baseProps.rules = [(val: any) => !!val || 'Required field'];
    }

    switch (field.type) {
      case 'text':
      case 'uid':
        if (field.maxLength) {
          baseProps.maxlength = field.maxLength;
          baseProps.counter = true;
        }
        if (field.regex) {
          baseProps.hint = `Pattern: ${field.regex}`;
        }
        break;
      case 'richtext':
        baseProps.type = 'textarea';
        baseProps.rows = 6;
        baseProps.hint = 'Rich text editor with formatting options';
        break;
      case 'number':
        baseProps.type = 'number';
        if (field.min !== undefined) baseProps.min = field.min;
        if (field.max !== undefined) baseProps.max = field.max;
        baseProps.hint = field.numberType ? `Format: ${field.numberType}` : undefined;
        break;
      case 'email':
        baseProps.type = 'email';
        baseProps.hint = 'Valid email address required';
        break;
      case 'password':
        baseProps.type = 'password';
        baseProps.hint = 'Secure password field';
        break;
      case 'datetime':
        baseProps.hint = 'Date and time selector';
        baseProps['prepend-icon'] = 'o_calendar_today';
        break;
      case 'boolean':
        baseProps.label = field.displayName || field.name;
        delete baseProps.outlined;
        delete baseProps.dense;
        break;
      case 'enumeration':
        let enumOptions: string[] = [];
        if (typeof field.enumValues === 'string') {
          enumOptions = field.enumValues.split('\n').filter((v: string) => v.trim());
        } else if (Array.isArray(field.enumValues)) {
          enumOptions = field.enumValues;
        }
        baseProps.options = enumOptions.length > 0 ? enumOptions : ['Option 1', 'Option 2', 'Option 3'];
        baseProps.hint = 'Select from predefined options';
        break;
      case 'relation':
        baseProps.options = [`${field.targetContentType || 'Related'} Item 1`, `${field.targetContentType || 'Related'} Item 2`];
        baseProps.hint = `Relation: ${field.relationType || 'oneToMany'}`;
        if (field.relationType === 'manyToMany' || field.relationType === 'oneToMany') {
          baseProps.multiple = true;
          baseProps['use-chips'] = true;
        }
        break;
      case 'json':
        baseProps.type = 'textarea';
        baseProps.rows = 4;
        baseProps.hint = 'JSON data structure';
        break;
      case 'media':
        const allowedTypes = field.allowedMediaTypes || ['image'];
        const isMultiple = field.mediaType === 'multiple';
        
        if (allowedTypes.includes('all') || allowedTypes.length === 0) {
          baseProps.hint = `${isMultiple ? 'Multiple' : 'Single'} media selection - All types allowed`;
        } else {
          const typeLabels: Record<string, string> = {
            image: 'Images',
            video: 'Videos',
            audio: 'Audio',
            document: 'Documents',
            pdf: 'PDFs'
          };
          const typeNames = allowedTypes.map(type => typeLabels[type] || type).join(', ');
          baseProps.hint = `${isMultiple ? 'Multiple' : 'Single'} media selection - ${typeNames}`;
        }
        break;
    }

    if (field.unique) {
      baseProps.hint = (baseProps.hint || '') + ' (Unique)';
    }
    if (field.private) {
      baseProps.hint = (baseProps.hint || '') + ' (Private)';
    }

    return baseProps;
  };

  // Get field component name for dynamic rendering
  const getFieldComponent = (field: Field) => {
    const componentMap: Record<string, string> = {
      text: 'q-input',
      richtext: 'q-editor',
      number: 'q-input',
      datetime: 'q-input',
      boolean: 'q-toggle',
      media: 'media-field',
      relation: 'q-select',
      json: 'q-input',
      uid: 'q-input',
      email: 'q-input',
      password: 'q-input',
      enumeration: 'q-select',
      component: 'div',
      dynamiczone: 'div',
    };
    return componentMap[field.type] || 'q-input';
  };

  return {
    allFieldTypes,
    isDragging,
    draggedItem,
    getFieldIcon,
    getFieldColor,
    getFieldTypeLabel,
    createField,
    validateField,
    onDragStart,
    onDragEnd,
    setFieldSize,
    deleteFieldWithConfirm,
    getFieldMockValue,
    getFieldProps,
    getFieldComponent
  };
}