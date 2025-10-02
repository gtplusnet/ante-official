import axios from 'axios';

interface ImageProxyOptions {
  maxRetries?: number;
  timeout?: number;
  fallbackUrl?: string;
}

interface ImageProxyResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  originalUrl: string;
}

/**
 * Converts external images to base64 data URLs to bypass CORS issues in html2canvas
 */
export class ImageProxy {
  private static cache = new Map<string, string>();

  /**
   * Converts an external image URL to a base64 data URL
   */
  static async toDataUrl(
    url: string,
    options: ImageProxyOptions = {}
  ): Promise<ImageProxyResult> {
    const { maxRetries = 5, timeout = 15000, fallbackUrl } = options;

    // Check cache first
    if (this.cache.has(url)) {
      console.log('Image found in cache:', url);
      return {
        success: true,
        dataUrl: this.cache.get(url)!,
        originalUrl: url
      };
    }

    // If it's already a data URL, return as-is
    if (url.startsWith('data:')) {
      return {
        success: true,
        dataUrl: url,
        originalUrl: url
      };
    }

    // If it's a local URL (starts with / or relative), return as-is
    if (url.startsWith('/') || !url.includes('://')) {
      return {
        success: true,
        dataUrl: url,
        originalUrl: url
      };
    }

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ImageProxy] Attempting to convert external image (attempt ${attempt}/${maxRetries}):`, url);

        // Check if it's a DigitalOcean Spaces URL
        const isDigitalOceanSpaces = url.includes('digitaloceanspaces.com');

        const headers: Record<string, string> = {
          'Accept': 'image/*,*/*',
        };

        // Add CORS headers for DigitalOcean Spaces
        if (isDigitalOceanSpaces) {
          headers['Origin'] = window.location.origin;
          headers['Access-Control-Request-Method'] = 'GET';
          headers['Access-Control-Request-Headers'] = 'Content-Type';
        }

        const response = await axios.get(url, {
          responseType: 'blob',
          timeout,
          headers,
          // Add withCredentials for CORS requests
          withCredentials: false,
        });

        const blob = response.data;

        // Validate blob is actually an image
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Invalid content type: ${blob.type}. Expected image.`);
        }

        const dataUrl = await this.blobToDataUrl(blob);

        // Validate the generated data URL
        if (!dataUrl.startsWith('data:image/')) {
          throw new Error('Generated data URL is not a valid image');
        }

        // Cache successful conversion
        this.cache.set(url, dataUrl);

        console.log(`[ImageProxy] Successfully converted external image to data URL (size: ${Math.round(blob.size / 1024)}KB)`);
        return {
          success: true,
          dataUrl,
          originalUrl: url
        };

      } catch (error: any) {
        lastError = error;
        console.warn(`[ImageProxy] Failed to convert image (attempt ${attempt}/${maxRetries}):`, {
          url,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        });

        // Wait before retrying with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(attempt * 2000, 8000); // Max 8 second delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, try fallback
    if (fallbackUrl && fallbackUrl !== url) {
      console.log('[ImageProxy] Trying fallback URL:', fallbackUrl);
      return this.toDataUrl(fallbackUrl, { ...options, fallbackUrl: undefined });
    }

    console.error('[ImageProxy] Failed to convert external image after all attempts:', {
      url,
      error: lastError?.message,
      status: lastError?.response?.status
    });

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      originalUrl: url
    };
  }

  /**
   * Converts a Blob to a data URL
   */
  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Preloads multiple images and converts external ones to data URLs
   */
  static async preloadImages(
    urls: string[],
    options: ImageProxyOptions = {}
  ): Promise<ImageProxyResult[]> {
    console.log('Preloading images:', urls.length);

    const results = await Promise.all(
      urls.map(url => this.toDataUrl(url, options))
    );

    const successful = results.filter(r => r.success).length;
    console.log(`Successfully preloaded ${successful}/${urls.length} images`);

    return results;
  }

  /**
   * Clears the image cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('Image proxy cache cleared');
  }

  /**
   * Gets cache statistics
   */
  static getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    };
  }
}

/**
 * Utility function to check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) return false;
  if (url.startsWith('/')) return false;
  if (!url.includes('://')) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

/**
 * Utility function to get a safe image URL
 * Now always returns direct URLs without base64 conversion
 */
export async function getSafeImageUrl(
  url: string,
  fallbackUrl?: string
): Promise<string> {
  console.log('[getSafeImageUrl] Processing URL:', url);

  if (!url) {
    console.log('[getSafeImageUrl] No URL provided, using fallback');
    return fallbackUrl || '';
  }

  // Always return direct URL - no conversion to base64
  console.log('[getSafeImageUrl] Returning direct URL (no base64 conversion)');
  return url;
}