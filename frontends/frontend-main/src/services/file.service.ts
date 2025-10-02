import { api } from 'src/boot/axios';

export class FileService {
  /**
   * Get file information by ID
   */
  static async getFileInfo(fileId: number): Promise<{ id: number; name: string; url: string } | null> {
    try {
      const response = await api.get(`/file-upload?id=${fileId}`);
      if (response.data) {
        return {
          id: response.data.id,
          name: response.data.name || response.data.originalName,
          url: response.data.url
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch file info:', error);
      return null;
    }
  }

  /**
   * Download file by opening URL in new tab
   */
  static downloadFile(url: string, fileName?: string) {
    if (!url) {
      console.error('No URL provided for download');
      return;
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank'; // Open in new tab
    if (fileName) {
      link.download = fileName;
    }
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * View file in new tab
   */
  static viewFile(url: string) {
    if (!url) {
      console.error('No URL provided for viewing');
      return;
    }
    
    window.open(url, '_blank');
  }
}