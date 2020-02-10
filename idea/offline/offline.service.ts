import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import Async = require('async');

import { IDEAAWSAPIService, CacheModes, APIRequestOption } from '../AWSAPI.service';
import { epochDateTime } from 'idea-toolbox';

/**
 * After how much time we need to request a synchronisation to keep the contents up-to-date.
 */
export const SYNC_EXPIRATION_INTERVAL = 1000 * 60 * 60 * 24; // a day
/**
 * Prefix of an online resource name, for the local storage.
 */
export const QUEUE_API_REQUESTS_KEY = 'IDEAOfflineService.queueAPIrequests';
/**
 * Id of the last sync time info in the local storage.
 */
export const LAST_SYNC_KEY = 'IDEAOfflineService.lastSyncAt';
/**
 * The max number of element to cache to automatically start the synchronisation.
 * After this number, a manual confirmation is requested, to save internet data and computational resources.
 */
export const MAX_NUM_ELEMENTS_FOR_QUICK_SYNC = 50;

/**
 * Manage the offline functioning of the app (upload/download/synchronization).
 *
 * Download: it works through the `mAt` mechanism on back-end resources.
 *
 * **How to use it**. Configure the sync mechanism in the main app.component as it follows
 *    1. set the resources to cache offline.
 *    2. run a synchronization
 *    3. enable the offline manager (UI).
 *    4. add API requests to the queue when offline
 * e.g.
 * ```
 * // set the resources we want to download from the back-end
 * this.offline.resourcesToCache = [
 *   new CacheableResource([`teams/${team.teamId}/models`], 'modelId', this.t.instant('MENU.MODELS')),
 *   new CacheableResource([`teams/${team.teamId}/activities`], 'activityId', this.t.instant('MENU.ACTIVITIES'))
 * ];
 * this.offline.synchronizeIfNeeded();
 * ```
 */
@Injectable()
export class IDEAOfflineService {
  /**
   * True/false if the platform is offline/online.
   */
  public isOffline: boolean;
  /**
   * True/false if the platform is online/offline. Shortcut.
   */
  public isOnline: boolean;
  /**
   * True when running a general synchronization.
   */
  public synchronizing: boolean;
  /**
   * The timestamp of the last general synchronization.
   */
  public lastSyncAt: epochDateTime;
  /**
   * True if an error happened in the last general synchronization.
   */
  public errorInLastSync: boolean;
  /**
   * True if the synchronisation is too vast and so require a manual action of the user.
   * Based on `MAX_NUM_ELEMENTS_FOR_QUICK_SYNC`.
   */
  public requiresManualConfirmation: boolean;
  /**
   * If false, ignore the entire upload scenario.
   */
  public useQueueAPIRequests: boolean;
  /**
   * The array of the requested not executed because offline; they need to run once online.
   */
  public queueAPIRequests: Array<APIRequest>;
  /**
   * The array of resources to cache offline from the back-end.
   */
  public resourcesToCache: Array<CacheableResource>;
  /**
   * The observable for subscribing to online/offline status changes.
   */
  protected observable: Observable<boolean>;

  constructor(protected storage: Storage, protected t: TranslateService, protected API: IDEAAWSAPIService) {
    this.setOnline(navigator.onLine);
    // create the observable to subscribe to the readings
    this.observable = new Observable(observer => {
      window.addEventListener('online', () => {
        // don't trust the browser: check with a fake request
        this.check().then(isOnline => {
          if (isOnline) {
            // once back online, try a synchronization if needed or if the last one failed
            if (this.errorInLastSync) this.synchronize();
            else this.synchronizeIfNeeded();
          }
          // notifiy the subscribers of the connection status change
          observer.next(isOnline);
        });
      });
      window.addEventListener('offline', () => {
        this.setOnline(false);
        // notifiy the subscribers of the connection status change
        observer.next(false);
      });
    });
    this.synchronizing = false;
    this.errorInLastSync = false;
    this.requiresManualConfirmation = false;
    this.useQueueAPIRequests = true;
    this.queueAPIRequests = new Array<APIRequest>();
    this.resourcesToCache = new Array<CacheableResource>();
    this.storage.get(LAST_SYNC_KEY).then((lastSyncAt: number) => (this.lastSyncAt = lastSyncAt || 0));
    // run a connection test every once in a while
    this.runContinousCheck();
  }
  /**
   * Subscribe to the service to be notified when the connection status changes.
   */
  public subscribe(callback: (isOnline: boolean) => void): Subscription {
    return this.observable.subscribe(callback);
  }

  //
  // ONLINE CHECK
  //

  /**
   * Quickly set both the helpers that determs the connection status.
   */
  public setOnline(isOnline: boolean) {
    this.isOnline = isOnline;
    this.isOffline = !isOnline;
  }
  /**
   * Quickly check for online connection.
   */
  public check(): Promise<boolean> {
    return new Promise(resolve =>
      this.API.getResource('online', { idea: true })
        .then(() => {
          this.setOnline(true);
          resolve(true);
        })
        .catch(() => {
          this.setOnline(false);
          resolve(false);
        })
    );
  }
  /**
   * Run a connection test every once in a while.
   */
  public runContinousCheck() {
    this.check();
    setTimeout(() => this.runContinousCheck(), 30 * 1000);
  }

  //
  // UPLOAD
  //

  /**
   * Execute all the API requests in the queue; the requests terminated with an error will
   * remain in the queue.
   */
  public runQueueAPIRequests(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.useQueueAPIRequests || this.isOffline || !this.queueAPIRequests.length) return resolve();
      this.synchronizing = true;
      Async.eachSeries(
        this.queueAPIRequests,
        (request: APIRequest, doneReq: any) => {
          const options: APIRequestOption = {};
          if (request.resourceId) options.resourceId = request.resourceId;
          if (request.body) options.body = request.body;
          let promise: any;
          switch (request.method.toUpperCase()) {
            case 'POST':
              promise = this.API.postResource(request.resource, options);
              break;
            case 'PUT':
              promise = this.API.putResource(request.resource, options);
              break;
            case 'PATCH':
              promise = this.API.patchResource(request.resource, options);
              break;
          }
          if (!promise) {
            request.error = 'INVALID_METHOD';
            doneReq();
            return;
          }
          promise
            .then(() => {
              request.error = null;
              doneReq();
            })
            .catch((err: Error) => {
              request.error = err.message || 'UNKNOWN_ERROR';
              doneReq();
            });
        },
        () => {
          // keep the requests NOT successfully executed
          this.saveQueueAPIRequest(this.queueAPIRequests.filter(x => x.error)).then(() => {
            // if the queue is empty, the entire operation was successful
            this.synchronizing = false;
            if (this.queueAPIRequests.length) reject();
            else resolve();
          });
        }
      );
    });
  }
  /**
   * Load from the local storage the API requests queue.
   */
  protected loadQueueAPIRequest(): Promise<Array<APIRequest>> {
    return new Promise(resolve => {
      if (!this.useQueueAPIRequests) return resolve([]);
      this.storage.get(QUEUE_API_REQUESTS_KEY).then((queue: Array<APIRequest>) => {
        this.queueAPIRequests = queue || [];
        resolve(this.queueAPIRequests);
      });
    });
  }
  /**
   * Update the queue in memory and also save the copy in the local storage.
   */
  public saveQueueAPIRequest(queue?: Array<APIRequest>): Promise<void> {
    this.queueAPIRequests = queue || this.queueAPIRequests;
    return this.storage.set(QUEUE_API_REQUESTS_KEY, this.queueAPIRequests);
  }
  /**
   * Delete a request stuck in an error.
   */
  public deleteRequest(request: APIRequest) {
    if (request) {
      this.queueAPIRequests.splice(this.queueAPIRequests.indexOf(request), 1);
      this.saveQueueAPIRequest();
    }
  }

  //
  // DOWNLOAD
  //

  /**
   * Analize the resource by consulting its list as an index, and gather the elements to cache (new/changed),
   * based on the `mAt` mechanism.
   * @return the index and the elements to cache
   */
  protected analyseResource(resource: CacheableResource): Promise<void> {
    return new Promise(resolve => {
      resource.synchronizing = true;
      resource.error = false;
      // get the resource elements ONLINE (list), for each resource path
      Async.forEach(
        resource.resourcePaths,
        (path, donePath) => {
          this.API.getResource(path, { useCache: CacheModes.NO_CACHE }).then((cloudElements: Array<any>) => {
            // get the resource elements OFFLINE (list)
            this.API.getResource(path, { useCache: CacheModes.CACHE_ONLY }).then((localElements: Array<any>) => {
              // prepare the list, keeping the most updated elements between cloud and local version
              resource.index[path] = cloudElements.map(cloudEl => {
                const localEl = localElements.find(l => l[resource.idAttribute] === cloudEl[resource.idAttribute]);
                if (!localEl) {
                  // !localEl -> download cloudEl
                  resource.elements[path].push(cloudEl[resource.idAttribute]);
                  return cloudEl;
                } else if (!localEl.mAt || !cloudEl.mAt || cloudEl.mAt > localEl.mAt) {
                  // cloudEl more recent than localEl -> download cloudEl
                  resource.elements[path].push(localEl[resource.idAttribute]);
                  return cloudEl;
                } else return localEl;
              });
              donePath();
            });
          });
        },
        () => resolve()
      );
    });
  }
  /**
   * Cache the analysed elements of a resource.
   * @todo old elements in cache aren't deleted (they just disappear from the index).
   */
  protected cacheResource(resource: CacheableResource): Promise<void> {
    return new Promise((resolve, reject) => {
      Async.forEach(
        resource.resourcePaths,
        (path, donePath) => {
          // cache the list: keep the most updated version (cloud/local) of each resource
          this.API.putInCache(path, resource.index[path]).then(() => {
            // cache the elements identified
            Async.eachSeries(
              resource.elements[path],
              (id: string, done: any) => {
                // note: the NETWORK_FIRST request will cache the response
                this.API.getResource(path, { resourceId: id, useCache: CacheModes.NETWORK_FIRST })
                  .then(() => done())
                  .catch((err: Error) => done(err));
              },
              (err: Error) => {
                // in case of errors, we wouldn't know which element had failed: kill the entire process
                resource.error = Boolean(err);
                resource.synchronizing = false;
                donePath(err);
              }
            );
          });
        },
        (err: Error) => (err ? reject(err) : resolve())
      );
    });
  }

  //
  // SYNCHRONISATION (UPLOAD+DOWNLOAD)
  //

  /**
   * Run general synchronization, only if needed, i.e. the cached content expired or
   * we have pending API requests in the queue.
   */
  public synchronizeIfNeeded() {
    this.loadQueueAPIRequest().then(() => {
      if (this.queueAPIRequests.length || Date.now() > this.lastSyncAt + SYNC_EXPIRATION_INTERVAL) this.synchronize();
    });
  }
  /**
   * General synchronization of the whole set of resources (upload+download).
   * @param manualConfirmation if true, the request comes directly from a user action (not automatic procedures).
   */
  public synchronize(manualConfirmation?: boolean) {
    if (this.synchronizing) return;
    this.synchronizing = true;
    this.errorInLastSync = false;
    this.requiresManualConfirmation = false;
    // try to upload the elements of all the offline resources
    this.runQueueAPIRequests()
      .then(() => {
        // analyse the resources to see if there are updated versions of the cached elements to download
        Async.each(
          this.resourcesToCache,
          (res, done) => this.analyseResource(res).then(() => done()),
          () => {
            // count the total number of the elements to cache in between all the resources
            let numElToCache = 0;
            this.resourcesToCache.forEach(r => (numElToCache += r.getNumElementsToCache()));
            // decide if to proceed with the syncronisation;
            // in case of too many elements to update, requires a manual confirmation
            if (numElToCache > MAX_NUM_ELEMENTS_FOR_QUICK_SYNC && !manualConfirmation) {
              this.requiresManualConfirmation = true;
              this.synchronizing = false;
              return;
            }
            // download the elements of the analysed resources
            Async.each(
              this.resourcesToCache,
              (resource, done) => {
                this.cacheResource(resource)
                  .then(() => done())
                  .catch(() => {
                    // show an error alert, but don't make the entire process to fail
                    this.errorInLastSync = true;
                    done();
                  });
              },
              () => {
                if (this.errorInLastSync) this.synchronizing = false;
                else {
                  // all the resources are succesfully in sync; update the timestamp of last sync
                  this.lastSyncAt = Date.now();
                  this.storage.set(LAST_SYNC_KEY, this.lastSyncAt).then(() => (this.synchronizing = false));
                }
              }
            );
          }
        );
      })
      .catch(() => {
        this.errorInLastSync = true;
        this.synchronizing = false;
      });
  }
}

/**
 * The description of an API request to a resource, to use with `IDEAAWSAPI`.
 * Used for queues of requests.
 */
export interface APIRequest {
  /**
   * Resource path (e.g. `users` or `teams/${teamId}/users`).
   */
  resource: string;
  /**
   * The id to identify a specific element of the resource.
   */
  resourceId: string;
  /**
   * The API request method (e.g. POST, PUT, PATCH).
   */
  method: string;
  /**
   * The body of the request.
   */
  body: object;
  /**
   * A description to show for the request.
   */
  description?: string;
  /**
   * If not null, the request tried to run but it encountered the error.
   */
  error?: string;
}

/**
 * A resource to cache offline from the back-end (DOWNLOAD).
 */
export class CacheableResource {
  /**
   * List of resource path (e.g. `users` or `teams/${teamId}/users`).
   */
  public resourcePaths: Array<string>;
  /**
   * The name of the attribute that works as resourceId.
   */
  public idAttribute: string;
  /**
   * The resource description.
   */
  public description: string;
  /**
   * Runtime attribute to know if the resource is synchronizing.
   */
  public synchronizing: boolean;
  /**
   * True if one of the elements failed to upload.
   */
  public error: boolean;
  /**
   * For each resourcePath, the index of the elements to cache for the path.
   */
  public index: {
    [key: string]: Array<any>;
  };
  /**
   * For each resourcePath, the elements to cache for the path.
   */
  public elements: {
    [key: string]: Array<string>;
  };

  constructor(resourcePaths: Array<string>, idAttribute: string, description?: string) {
    this.resourcePaths = resourcePaths.map((x: string) => (x ? String(x) : null));
    this.idAttribute = idAttribute;
    this.description = description || name;
    this.synchronizing = false;
    this.error = false;
    this.index = {};
    resourcePaths.forEach((x: string) => (this.index[x] = new Array<any>()));
    this.elements = {};
    resourcePaths.forEach((x: string) => (this.elements[x] = new Array<string>()));
  }

  public getNumElementsToCache(): number {
    let count = 0;
    this.resourcePaths.forEach(p => (count += this.elements[p].length));
    return count;
  }
}
