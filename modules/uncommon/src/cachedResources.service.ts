import { Injectable, inject } from '@angular/core';
import { IDEAStorageService } from '@idea-ionic/common';

/**
 * *The service aims to solve the resource caching behaviour of browsers.*
 * *It's suggested to use it with avatars and other images/resources that can change based on user input.*
 * The browsers tend to cache images based on their URL;
 * sometimes, the image changes but the URL doesn't, and the browser keeps showing the old image.
 * Through this service, when we change a resource (e.g. an image), we also update a cache key.
 * Each time we load a resource through the service's method `getCachedImage`, we use the cache key as a query param;
 * in this way, the browser uses the same cached images, until we change the cache key.
 */
@Injectable({ providedIn: 'root' })
export class IDEACachedResourcesService {
  /**
   * Change it only if necessary.
   */
  cacheKeyIndex = 'IDEA_CACHED_RESOURCES_KEY';

  private cacheKey: string;

  private storage = inject(IDEAStorageService);

  constructor() {
    this.loadKeyFromStorage();
  }
  /**
   * Load the cache key from the local storage.
   */
  private loadKeyFromStorage(): void {
    this.storage.get(this.cacheKeyIndex).then(key => {
      if (key) this.cacheKey = key;
      else this.updateCacheKey(Date.now());
    });
  }

  /**
   * Get an image using the service's caching mechanism.
   * Optionally update the cache key and forces the image's cache deletion.
   */
  getCachedResource(url: string, updateCacheKey?: boolean): string {
    const key = updateCacheKey ? this.updateCacheKey() : this.cacheKey;
    return url.concat(`?crs=${key}`);
  }
  /**
   * Set a new cache key.
   */
  async updateCacheKey(key: string | number = Date.now()): Promise<void> {
    this.cacheKey = String(key);
    await this.storage.set(this.cacheKeyIndex, key);
  }
}
