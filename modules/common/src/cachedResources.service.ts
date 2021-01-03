import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { IDEATinCanService } from './tinCan.service';

/**
 * *The service aims to solve the resource caching behaviour of browsers.*
 * *It's suggested to use it with avatars and other images/resources that can change based on user input.*
 * The browsers tend to cache images based on their URL;
 * sometimes, the image changes but the URL doesn't, and the browser keeps showing the old image.
 * Through this service, when we change a resource (e.g. an image), we also update a cache key.
 * Each time we load a resource through the service's method `getCachedImage`, we use the cache key as a query param;
 * in this way, the browser uses the same cached images, until we change the cache key.
 */
@Injectable()
export class IDEACachedResourcesService {
  /**
   * Change it only if necessary.
   */
  public cacheKeyIndex = 'IDEA_CACHED_RESOURCES_KEY';

  constructor(public storage: Storage, public tc: IDEATinCanService) {
    this.loadKeyFromStorage();
  }

  /**
   * Get an image using the service caching mechanism.
   * Optionally update the cache key and forces the image cache deletion.
   */
  public getCachedResource(url: string, updateCacheKey?: boolean) {
    const key = String(updateCacheKey ? this.updateCacheKey() : this.tc.get(this.cacheKeyIndex));
    return url.concat(`?crs=${key}`);
  }

  /**
   * Load the cache key from the local storage.
   */
  public loadKeyFromStorage() {
    this.storage.ready().then(() => {
      this.storage.get(this.cacheKeyIndex).then(key => {
        if (key) this.tc.set(this.cacheKeyIndex, key);
        else this.updateCacheKey(Date.now());
      });
    });
  }

  /**
   * Update the cache key or set a new one.
   */
  public updateCacheKey(key?: any): string {
    key = String(key | Date.now());
    this.tc.set(this.cacheKeyIndex, key);
    this.storage.set(this.cacheKeyIndex, key);
    return key;
  }
}
