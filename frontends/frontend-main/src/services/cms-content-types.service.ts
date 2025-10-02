import { api } from 'src/boot/axios';
import type { ContentType, Field } from '@components/shared/cms/types/content-type';

export interface CreateContentTypeDto {
  name: string;
  displayName: string;
  type: 'collection' | 'single' | 'component';
  singularName?: string;
  pluralName?: string;
  category?: string;
  description?: string;
  draftPublish?: boolean;
  internationalization?: boolean;
}

export interface UpdateContentTypeDto extends Partial<CreateContentTypeDto> {
  fields?: Field[];
}

export class CMSContentTypesService {
  /**
   * Get all content types
   */
  static async getAll(): Promise<ContentType[]> {
    try {
      const response = await api.get('/cms/content-types');
      const rawData = response.data.data || [];
      
      // Map _id to id if needed (MongoDB uses _id) and fix field IDs
      const mappedData = rawData.map((item: any) => ({
        ...item,
        id: item._id || item.id || `fallback_${item.name}_${Date.now()}`,
        // Always prefer backend _id for fields to avoid 404 errors
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`
        })) : []
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Failed to fetch content types:', error);
      throw error;
    }
  }

  /**
   * Get content types by type (collection, single, component)
   */
  static async getByType(
    type: 'collection' | 'single' | 'component', 
    includeArchived: boolean = false
  ): Promise<ContentType[]> {
    try {
      const response = await api.get(`/cms/content-types?type=${type}&includeArchived=${includeArchived}`);
      const rawData = response.data.data || [];
      
      // Map _id to id if needed (MongoDB uses _id) and fix field IDs
      const mappedData = rawData.map((item: any) => ({
        ...item,
        id: item._id || item.id || `fallback_${type}_${item.name}_${Date.now()}`,
        // Always prefer backend _id for fields to avoid 404 errors
        fields: item.fields ? item.fields.map((field: any, index: number) => {
          console.log(`[CMS DEBUG] Field ${index} RAW from API:`, {
            id: field._id || field.id,
            name: field.name,
            size: field.size,
            type: field.type,
            allProperties: Object.keys(field)
          });
          
          const mappedField = {
            ...field,
            id: field.id || field._id || `fallback_field_${index}`,
            _id: field._id || field.id  // Preserve both for compatibility
          };
          
          console.log(`[CMS DEBUG] Field ${index} after mapping:`, {
            id: mappedField.id,
            name: mappedField.name,
            size: mappedField.size,
            type: mappedField.type,
            allProperties: Object.keys(mappedField)
          });
          
          return mappedField;
        }) : []
      }));
      
      console.log(`[CMS DEBUG] ${type} types RAW from API:`, rawData.map((item: any) => ({
        contentTypeId: item._id || item.id,
        name: item.name,
        rawFields: item.fields?.map((f: any) => ({ 
          rawId: f._id || f.id,
          name: f.name,
          type: f.type,
          allKeys: Object.keys(f)
        }))
      })));
      
      console.log(`[CMS DEBUG] ${type} types after ID mapping:`, mappedData.map((item: any) => ({
        originalId: item._id,
        mappedId: item.id,
        name: item.name,
        fieldsCount: item.fields.length,
        fieldIds: item.fields.map((f: any) => f.id)
      })));
      
      return mappedData;
    } catch (error) {
      console.error(`Failed to fetch ${type} content types:`, error);
      throw error;
    }
  }

  /**
   * Get single content type by ID
   */
  static async getById(id: string): Promise<ContentType> {
    try {
      const response = await api.get(`/cms/content-types/${id}`);
      const item = response.data.data;
      
      console.log('[CMS DEBUG] getById - Raw response:', {
        contentTypeId: item._id || item.id,
        fieldsCount: item.fields?.length || 0,
        fields: item.fields?.map((f: any) => ({ id: f.id, name: f.name }))
      });
      
      // Map _id to id if needed and ensure consistent field IDs
      const mappedData = {
        ...item,
        id: item._id || item.id,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field.id || field._id || `fallback_field_${index}`,
          _id: field._id || field.id  // Preserve both for compatibility
        })) : []
      };
      
      console.log('[CMS DEBUG] getById - Mapped data:', {
        contentTypeId: mappedData.id,
        fieldsCount: mappedData.fields.length,
        fields: mappedData.fields.map((f: any) => ({ id: f.id, _id: f._id, name: f.name }))
      });
      
      return mappedData;
    } catch (error) {
      console.error('Failed to fetch content type:', error);
      throw error;
    }
  }

  /**
   * Create new content type
   */
  static async create(data: CreateContentTypeDto): Promise<ContentType> {
    try {
      const response = await api.post('/cms/content-types', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create content type:', error);
      throw error;
    }
  }

  /**
   * Update content type
   */
  static async update(id: string, data: UpdateContentTypeDto): Promise<ContentType> {
    try {
      const response = await api.put(`/cms/content-types/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update content type:', error);
      throw error;
    }
  }

  /**
   * Delete content type
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`/cms/content-types/${id}`);
    } catch (error) {
      console.error('Failed to delete content type:', error);
      throw error;
    }
  }

  /**
   * Restore archived content type
   */
  static async restore(id: string): Promise<ContentType> {
    try {
      const response = await api.post(`/cms/content-types/${id}/restore`);
      const item = response.data.data;
      
      // Ensure consistent ID mapping
      const mappedData = {
        ...item,
        id: item._id || item.id,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`,
          _id: field._id,  // Always preserve _id
          name: field.name || '',  // Ensure name exists
          displayName: field.displayName || field.name || ''
        })) : []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Failed to restore content type:', error);
      throw error;
    }
  }

  /**
   * Add field to content type
   */
  static async addField(contentTypeId: string, field: Field): Promise<ContentType> {
    try {
      const response = await api.post(`/cms/content-types/${contentTypeId}/fields`, field);
      const item = response.data.data;
      
      // Ensure consistent ID mapping
      const mappedData = {
        ...item,
        id: item._id || item.id,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`,
          _id: field._id,  // Always preserve _id
          name: field.name || '',  // Ensure name exists
          displayName: field.displayName || field.name || ''
        })) : []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Failed to add field:', error);
      throw error;
    }
  }

  /**
   * Update field in content type
   */
  static async updateField(contentTypeId: string, fieldId: string, field: Partial<Field>): Promise<ContentType> {
    try {
      const response = await api.put(`/cms/content-types/${contentTypeId}/fields/${fieldId}`, field);
      const item = response.data.data;
      
      // Ensure consistent ID mapping
      const mappedData = {
        ...item,
        id: item._id || item.id,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`,
          _id: field._id,  // Always preserve _id
          name: field.name || '',  // Ensure name exists
          displayName: field.displayName || field.name || ''
        })) : []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  }

  /**
   * Delete field from content type
   */
  static async deleteField(contentTypeId: string, fieldId: string): Promise<ContentType> {
    try {
      const response = await api.delete(`/cms/content-types/${contentTypeId}/fields/${fieldId}`);
      const item = response.data.data;
      
      // Always prefer backend _id for fields to avoid 404 errors
      const mappedData = {
        ...item,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`
        })) : []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Failed to delete field:', error);
      throw error;
    }
  }

  /**
   * Reorder fields in content type
   */
  static async reorderFields(contentTypeId: string, fieldIds: string[]): Promise<ContentType> {
    try {
      const response = await api.put(`/cms/content-types/${contentTypeId}/fields/reorder`, { fieldIds });
      const item = response.data.data;
      
      // Ensure consistent ID mapping
      const mappedData = {
        ...item,
        id: item._id || item.id,
        fields: item.fields ? item.fields.map((field: any, index: number) => ({
          ...field,
          id: field._id || field.id || `fallback_field_${index}`,
          _id: field._id,  // Always preserve _id
          name: field.name || '',  // Ensure name exists
          displayName: field.displayName || field.name || ''
        })) : []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      throw error;
    }
  }

  /**
   * Search content types
   */
  static async search(query: string): Promise<ContentType[]> {
    try {
      const response = await api.get(`/cms/content-types/search?q=${encodeURIComponent(query)}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to search content types:', error);
      throw error;
    }
  }

  /**
   * Export content type schema
   */
  static async exportSchema(id: string): Promise<any> {
    try {
      const response = await api.get(`/cms/content-types/${id}/export`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to export content type schema:', error);
      throw error;
    }
  }

  /**
   * Import content type schema
   */
  static async importSchema(schema: any): Promise<ContentType> {
    try {
      const response = await api.post('/cms/content-types/import', schema);
      return response.data.data;
    } catch (error) {
      console.error('Failed to import content type schema:', error);
      throw error;
    }
  }
}