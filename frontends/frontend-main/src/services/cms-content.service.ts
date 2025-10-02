import { api } from 'src/boot/axios';

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  data: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  version: number;
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  locale?: string;
  dateRange?: {
    field: string;
    from: Date;
    to: Date;
  };
}

export interface ContentResponse {
  data: ContentEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateContentDto {
  data: Record<string, any>;
  status?: 'draft' | 'published';
  publishedAt?: Date;
  locale?: string;
}

export interface UpdateContentDto {
  data?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  locale?: string;
}

export class CMSContentService {
  /**
   * Transform MongoDB entry (_id) to frontend format (id)
   */
  private static transformEntry(entry: any): ContentEntry {
    if (!entry) return entry;
    
    // Extract _id and transform to id
    const { _id, ...rest } = entry;
    return {
      id: _id?.toString() || entry.id,
      ...rest
    } as ContentEntry;
  }

  /**
   * Transform array of entries
   */
  private static transformEntries(entries: any[]): ContentEntry[] {
    if (!Array.isArray(entries)) return [];
    return entries.map(entry => this.transformEntry(entry));
  }

  /**
   * Get content entries for a content type
   */
  static async getContent(contentTypeId: string, query?: ContentQuery): Promise<ContentResponse> {
    try {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              params.append(key, JSON.stringify(value));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await api.get(`/cms/content/${contentTypeId}?${params.toString()}`);
      return {
        data: this.transformEntries(response.data.data || []),
        total: response.data.meta?.total || 0,
        page: response.data.meta?.page || 1,
        limit: response.data.meta?.pageSize || 20,
        totalPages: response.data.meta?.pageCount || 0
      };
    } catch (error) {
      console.error('Failed to fetch content:', error);
      throw error;
    }
  }

  /**
   * Get single content entry by ID
   */
  static async getById(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.get(`/cms/content/${contentTypeId}/${entryId}`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to fetch content entry:', error);
      throw error;
    }
  }

  /**
   * Create new content entry
   */
  static async create(contentTypeId: string, data: CreateContentDto): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}`, data);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to create content entry:', error);
      throw error;
    }
  }

  /**
   * Update content entry
   */
  static async update(contentTypeId: string, entryId: string, data: UpdateContentDto): Promise<ContentEntry> {
    try {
      const response = await api.put(`/cms/content/${contentTypeId}/${entryId}`, data);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to update content entry:', error);
      throw error;
    }
  }

  /**
   * Delete content entry
   */
  static async delete(contentTypeId: string, entryId: string): Promise<void> {
    try {
      await api.delete(`/cms/content/${contentTypeId}/${entryId}`);
    } catch (error) {
      console.error('Failed to delete content entry:', error);
      throw error;
    }
  }

  /**
   * Publish content entry
   */
  static async publish(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/publish`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to publish content entry:', error);
      throw error;
    }
  }

  /**
   * Unpublish content entry
   */
  static async unpublish(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/unpublish`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to unpublish content entry:', error);
      throw error;
    }
  }

  /**
   * Archive content entry
   */
  static async archive(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/archive`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to archive content entry:', error);
      throw error;
    }
  }

  /**
   * Restore archived content entry
   */
  static async restore(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/restore`);
      return this.transformEntry(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to restore content entry:', error);
      throw error;
    }
  }

  /**
   * Duplicate content entry
   */
  static async duplicate(contentTypeId: string, entryId: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/duplicate`);
      return this.transformEntry(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to duplicate content entry:', error);
      throw error;
    }
  }

  /**
   * Get content entry versions
   */
  static async getVersions(contentTypeId: string, entryId: string): Promise<ContentEntry[]> {
    try {
      const response = await api.get(`/cms/content/${contentTypeId}/${entryId}/versions`);
      return this.transformEntries(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch content versions:', error);
      throw error;
    }
  }

  /**
   * Restore content entry to specific version
   */
  static async restoreVersion(contentTypeId: string, entryId: string, version: number): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/${contentTypeId}/${entryId}/versions/${version}/restore`);
      return this.transformEntry(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to restore content version:', error);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  static async bulkPublish(contentTypeId: string, entryIds: string[]): Promise<void> {
    try {
      await api.post(`/cms/content/${contentTypeId}/bulk/publish`, { entryIds });
    } catch (error) {
      console.error('Failed to bulk publish entries:', error);
      throw error;
    }
  }

  static async bulkUnpublish(contentTypeId: string, entryIds: string[]): Promise<void> {
    try {
      await api.post(`/cms/content/${contentTypeId}/bulk/unpublish`, { entryIds });
    } catch (error) {
      console.error('Failed to bulk unpublish entries:', error);
      throw error;
    }
  }

  static async bulkDelete(contentTypeId: string, entryIds: string[]): Promise<void> {
    try {
      await api.post(`/cms/content/${contentTypeId}/bulk/delete`, { entryIds });
    } catch (error) {
      console.error('Failed to bulk delete entries:', error);
      throw error;
    }
  }

  // Single Type Methods
  /**
   * Get single type content (returns existing or creates default)
   */
  static async getSingleTypeContent(contentTypeName: string): Promise<ContentEntry> {
    try {
      const response = await api.get(`/cms/content/single/${contentTypeName}`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to fetch single type content:', error);
      throw error;
    }
  }

  /**
   * Update single type content (upsert operation)
   */
  static async updateSingleTypeContent(contentTypeName: string, data: UpdateContentDto): Promise<ContentEntry> {
    try {
      const response = await api.put(`/cms/content/single/${contentTypeName}`, data);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to update single type content:', error);
      throw error;
    }
  }

  /**
   * Publish single type content
   */
  static async publishSingleType(contentTypeName: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/single/${contentTypeName}/publish`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to publish single type content:', error);
      throw error;
    }
  }

  /**
   * Unpublish single type content
   */
  static async unpublishSingleType(contentTypeName: string): Promise<ContentEntry> {
    try {
      const response = await api.post(`/cms/content/single/${contentTypeName}/unpublish`);
      return this.transformEntry(response.data.data);
    } catch (error) {
      console.error('Failed to unpublish single type content:', error);
      throw error;
    }
  }
}