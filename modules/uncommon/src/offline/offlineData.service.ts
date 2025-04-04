import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Delta, DeltaRecord, DeltaResources, epochDateTime } from 'idea-toolbox';
import { IDEAStorageService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAWSAPIService, APIRequestOption } from '../AWSAPI.service';
import { IDEAOfflineService } from './offline.service';

/**
 * After how much time we need to request a synchronisation to keep the contents up-to-date.
 */
export const SYNC_EXPIRATION_INTERVAL = 1000 * 60 * 60 * 24; // a day
/**
 * Prefix for the key of the API requests queue info in the local storage.
 */
export const QUEUE_API_REQUESTS_KEY = 'IDEAOfflineService.queueAPIrequests';
/**
 * Prefix for the key of the last sync time info in the local storage.
 */
export const LAST_SYNC_KEY = 'IDEAOfflineService.lastSyncAt';
/**
 * The max number of elements per resource to synchronize during the first analysis of a synchronisation.
 * If the number of elements exceeds (there is more data after the 1st page), the operation require manual confirmation.
 */
export const NUM_ELEMENTS_WITHOUT_MANUAL_SYNC = 100;
/**
 * The max number of elements per resource to request at the same time during a normal synchronisation.
 */
export const NUM_ELEMENTS_WITH_MANUAL_SYNC = 300;

/**
 * Manage the offline functioning of the app's data (upload/download/synchronization).
 * Note: it includes all the methods of IDEAOfflineService.
 *
 * Download: it works through the **Delta** mechanism on back-end resources.
 * Practically, the service prepares each possible API GET requests for each of the involved resources.
 * In this way, if offline, the API service can hit an element by URL in the cache (storage offline).
 *
 * **How to use it**. Configure the sync mechanism in the main app.component as it follows:
 *
 *    1. Implement a CacheableResource class for each DeltaResource you want to cache offline.
 *    2. Set up the service (`setUpOfflineData`).
 *    3. Run a synchronization.
 *    4. Add the navigation to the Offline Manager (UI).
 *    5. Optionally, push offline API requests to the queue when offline.
 *
 * e.g. of CacheableResource classes:
 * ```
 * class CustomerCR extends CacheableResource {
 *   constructor(description: string) {
 *     super(DeltaResources.CUSTOMERS, description);
 *   }
 *   public listURL(element: any): string {
 *     return `teams/${element.teamId}/customers`;
 *   }
 *   public elementURL(element: any): string {
 *     return `teams/${element.teamId}/customers/${element.customerId}`;
 *   }
 *   public findIndexInList(list: Array<any>, element: any): number {
 *     return list.findIndex(x => x.customerId === element.customerId);
 *   }
 *   public sort(a: any, b: any): number {
 *     return a.name.localeCompare(b.name);
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class IDEAOfflineDataService {
  protected _storage = inject(IDEAStorageService);
  protected _translate = inject(IDEATranslationsService);
  protected _offline = inject(IDEAOfflineService);
  protected _API = inject(IDEAAWSAPIService);

  /**
   * True when running a synchronization.
   */
  synchronizing: boolean;
  /**
   * The timestamp of the last synchronization.
   */
  lastSyncAt: epochDateTime;
  /**
   * True if an error happened in the last synchronization.
   */
  errorInLastSync: boolean;
  /**
   * True if the synchronisation is too vast and so require a manual action of the user.
   */
  requiresManualConfirmation: boolean;
  /**
   * If false, ignore the entire upload scenario.
   */
  useQueueAPIRequests: boolean;
  /**
   * The array of the requests not executed because we are/were offline; they need to run once online.
   */
  queueAPIRequests: APIRequest[];

  /**
   * The id of the team of which to manage data offline.
   * If null, the project isn't teams-based.
   */
  protected teamId: string;
  /**
   * The array of DeltaResources to cache offline.
   */
  protected resources: (DeltaResources | string)[];
  /**
   * Helper structure to manage the CacheableResource for each DeltaResource.
   */
  protected cacheableResources: { [resource: string]: CacheableResource };
  /**
   * Key to acquire from the storage the lastSyncAt information of the team.
   */
  protected lastSyncKey: string;
  /**
   * Key to acquire from the storage the lastSyncAt information of the team.
   */
  protected queueAPIRequestKey: string;

  constructor() {
    this.queueAPIRequests = new Array<APIRequest>();
    this.resources = new Array<string>();
    this.cacheableResources = {};
    // subscribe to network changes
    this._offline.subscribe(isOnline => {
      if (isOnline) {
        // try a synchronization if needed or if the last one failed
        if (this.errorInLastSync) this.synchronize();
        else this.synchronizeIfNeeded();
      }
    });
  }

  //
  // NETWORK STATUS from IDEAOfflineService
  //

  /**
   * Quickly check the connection status.
   */
  isOnline(): boolean {
    return this._offline.isOnline();
  }
  /**
   * Quickly check the connection status.
   */
  isOffline(): boolean {
    return this._offline.isOffline();
  }
  /**
   * Subscribe to the service to be notified when the connection status changes.
   */
  subscribe(callback: (isOnline: boolean) => void): Subscription {
    return this._offline.subscribe(callback);
  }
  /**
   * Quickly check for online connection.
   */
  public check(): Promise<boolean> {
    return this._offline.check();
  }

  //
  // CONFIGURATION
  //

  /**
   * Whether the offline mode is allowed. You can customize this function, if needed.
   */
  isAllowed(): boolean {
    return !!this.resources.length;
  }
  /**
   * Set up the service to use and sync offline data.
   */
  setUpOfflineData(teamId: string, useQueueAPIRequests: boolean, cacheableResources: CacheableResource[]): void {
    // set the team
    this.teamId = teamId;
    // decide if to allow certain API request while offline
    this.useQueueAPIRequests = useQueueAPIRequests;
    // load the API request pending queue, if any
    this.queueAPIRequestKey = this.teamId ? `${QUEUE_API_REQUESTS_KEY}_${this.teamId}` : QUEUE_API_REQUESTS_KEY;
    this.loadQueueAPIRequest();
    // load the lastSyncAt information for the team
    this.lastSyncKey = this.teamId ? `${LAST_SYNC_KEY}_${this.teamId}` : LAST_SYNC_KEY;
    this.loadLastSyncAt();
    // load the cacheable resources
    this.resources = new Array<DeltaResources | string>();
    this.cacheableResources = {};
    cacheableResources.forEach(r => this.addCacheableResource(r));
  }
  /**
   * Load from the local storage the last sync at information.
   */
  protected loadLastSyncAt(): Promise<number> {
    return new Promise(resolve => {
      this._storage.get(this.lastSyncKey).then((lastSyncAt: number): void => {
        this.lastSyncAt = lastSyncAt ? Number(lastSyncAt) : null;
        resolve(this.lastSyncAt);
      });
    });
  }
  /**
   * Update last sync at info in the local storage.
   */
  protected saveLastSyncAt(lastSyncAt: number): Promise<void> {
    this.lastSyncAt = lastSyncAt;
    return this._storage.set(this.lastSyncKey, lastSyncAt);
  }
  /**
   * Add a CacheableResource.
   */
  protected addCacheableResource(cacheableResource: CacheableResource): void {
    if (this.teamId) cacheableResource.teamId = this.teamId;
    this.cacheableResources[cacheableResource.resource] = cacheableResource;
    this.resources.push(cacheableResource.resource);
  }
  /**
   * Remove a CacheableResource by its DeltaResource.
   */
  protected removeCacheableResource(resource: DeltaResources | string): void {
    delete this.cacheableResources[resource];
    this.resources.splice(this.resources.indexOf(resource), 1);
  }
  /**
   * Get the the DeltaResourced configured.
   */
  getResources(): (DeltaResources | string)[] {
    return this.resources;
  }
  /**
   * Get a CacheableResource by its DeltaResource.
   */
  getCacheableResource(resource: DeltaResources | string): CacheableResource {
    return this.cacheableResources[resource];
  }

  //
  // UPLOAD
  //

  /**
   * Execute all the API requests in the queue; the requests terminated with an error will remain in the queue.
   */
  protected runQueueAPIRequests(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (!this.useQueueAPIRequests || this.isOffline() || !this.queueAPIRequests.length) return resolve();
      this.queueAPIRequests.forEach(async request => {
        const options: APIRequestOption = {};
        if (request.resourceId) options.resourceId = request.resourceId;
        if (request.body) options.body = request.body;
        let promise: Promise<any>;
        try {
          switch (request.method.toUpperCase()) {
            case 'POST':
              promise = await this._API.postResource(request.resource, options);
              break;
            case 'PUT':
              promise = await this._API.putResource(request.resource, options);
              break;
            case 'PATCH':
              promise = await this._API.patchResource(request.resource, options);
              break;
          }
          if (!promise) request.error = 'INVALID_METHOD';
          else request.error = null;
        } catch (err) {
          request.error = (err as Error).message || 'UNKNOWN_ERROR';
        }
      });
      // keep the requests NOT successfully executed
      this.saveQueueAPIRequest(this.queueAPIRequests.filter(x => x.error)).then((): void => {
        // if the queue is empty, the entire operation was successful
        if (this.queueAPIRequests.length) reject();
        else resolve();
      });
    });
  }
  /**
   * Load from the local storage the API requests queue.
   */
  protected loadQueueAPIRequest(): Promise<APIRequest[]> {
    return new Promise(resolve => {
      if (!this.useQueueAPIRequests) return resolve([]);
      this._storage.get(this.queueAPIRequestKey).then((queue: APIRequest[]): void => {
        this.queueAPIRequests = queue || [];
        resolve(this.queueAPIRequests);
      });
    });
  }
  /**
   * Update the queue in memory and also save the copy in the local storage.
   */
  saveQueueAPIRequest(queue?: APIRequest[]): Promise<void> {
    if (!this.isAllowed()) return Promise.reject();
    this.queueAPIRequests = queue || this.queueAPIRequests;
    return this._storage.set(this.queueAPIRequestKey, this.queueAPIRequests);
  }
  /**
   * Delete a request stuck in an error.
   */
  deleteRequest(request: APIRequest) {
    if (!this.isAllowed()) return Promise.reject();
    if (request) {
      this.queueAPIRequests.splice(this.queueAPIRequests.indexOf(request), 1);
      this.saveQueueAPIRequest();
    }
  }

  //
  // DOWNLOAD
  //

  /**
   * Save the records of a delta and, if the latter has more pages, go recursive.
   */
  protected async syncDeltaRecords(delta: Delta, done?: any): Promise<any> {
    // for each resource, we reset the status; if a resource still need to be synchronized, it will be flagged below
    this.resources.forEach(resource => {
      this.cacheableResources[resource].error = false;
      this.cacheableResources[resource].synchronizing = false;
    });
    try {
      // synchronze each of the resources included in the delta; this execution can go in parallel
      await Promise.all(
        delta.resources.map(async resource => {
          const cr = this.cacheableResources[resource];
          if (cr) {
            // synchronize the delta records; note: the executuion inside a resource must go in series
            cr.synchronizing = true;
            const success = await this.syncResourceDeltaRecords(resource, delta.records[resource]);
            if (!success) this.errorInLastSync = true;
          }
        })
      );
      // if there were error of if there is nothing left to sync, we are done
      if (this.errorInLastSync || !delta.next) return done();
      // otherwise, get the next page of the delta and go recursive until we are done
      const params: any = { next: delta.next, limit: NUM_ELEMENTS_WITH_MANUAL_SYNC };
      if (this.lastSyncAt) params.since = this.lastSyncAt;
      const newDelta = await this._API.getResource(this.teamId ? `teams/${this.teamId}/delta` : 'delta', { params });
      this.syncDeltaRecords(newDelta, done);
    } catch (err) {
      // if something went wrong, stops the operation, since we need to make sure the entire flow is consistent
      this.errorInLastSync = true;
      return done();
    }
  }
  /**
   * Save offline a list of DeltaRecords for this resource, creating a map of all the corresponding API GET requests.
   */
  protected async syncResourceDeltaRecords(resource: string, records: DeltaRecord[]): Promise<boolean> {
    // acquire the info an a cacheable resource
    const cr = this.cacheableResources[resource];
    if (!cr) return Promise.resolve(true);
    try {
      // prepare helpers to group executions of elements of the same list
      let list: any[] = null,
        oldListURL: string = null;
      for (const r of records) {
        // calculate the URL to access the API request key for this element
        const elementURL = cr.elementURL(r.element);
        // if the element was deleted (based on delta), delete its corresponding API GET request
        if (r.deleted) await this._API.deleteFromCache(elementURL);
        // otherwise, update it
        else await this._API.putInCache(elementURL, r.element);
        // calculate the URLs to access the API request key for this element's list
        const listURL = cr.listURL(r.element);
        // to improve the performance, get/sort/save the list only when it changes from the previous element's one.
        if (listURL !== oldListURL) {
          // skip first cycle (oldListURL === null)
          if (oldListURL) {
            // re-sort the list; note: it should be sorted from the last time, so we only manage the new element
            list = list.sort(cr.sort);
            // save the updated list
            await this._API.putInCache(oldListURL, list);
          }
          // get the list of elements from the local storage by the calculated URL
          list = await this._API.getFromCache(listURL);
          // save the reference to the list for the next cycle
          oldListURL = listURL;
        }
        // find in the list the element we want to manage
        const index = cr.findIndexInList(list, r.element);
        // delete the element from the list
        if (index !== -1) list.splice(index, 1);
        // if the element wasn't deleted (following the delta record information), insert the new version
        if (!r.deleted) list.push(r.element);
      }
      // in case there were elements, save the last element's list
      if (oldListURL) {
        // re-sort the list; note: it should be sorted from the last time, so we only manage the new element
        list = list.sort(cr.sort);
        // save the updated list
        await this._API.putInCache(oldListURL, list);
      }
      return Promise.resolve(true);
    } catch (err) {
      // if something went wrong, stops the operation, since we need to make sure the entire flow is consistent
      cr.error = true;
      return Promise.resolve(false);
    }
  }

  //
  // SYNCHRONISATION (UPLOAD+DOWNLOAD)
  //

  /**
   * Run a sync, but only if needed, i.e. the cached content expired or we have pending API requests in the queue.
   */
  synchronizeIfNeeded(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (!this.isAllowed()) return;
      this.loadLastSyncAt().then(
        (): Promise<void> =>
          this.loadQueueAPIRequest()
            .then((): void => {
              if (this.queueAPIRequests.length || Date.now() > this.lastSyncAt + SYNC_EXPIRATION_INTERVAL)
                this.synchronize();
              resolve();
            })
            .catch(err => reject(err))
      );
    });
  }
  /**
   * Synchronization of the whole set of resources (upload+download).
   * @param manualConfirmation if true, the request comes directly from a user action (not automatic procedures).
   */
  synchronize(manualConfirmation?: boolean): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (!this.isAllowed() || this.synchronizing) return resolve();
      this.synchronizing = true;
      this.errorInLastSync = false;
      this.requiresManualConfirmation = false;
      // load the lastSyncAt information
      this.loadLastSyncAt().then(
        (): Promise<void> =>
          // try to run all the pending API requests in the queue, i.e. uploading the offline resources changed
          this.runQueueAPIRequests()
            .then((): void => {
              // set this moment in time: if anything happened before the end of the sync, we don't lose fresh data
              const now = Date.now();
              // prepare a first "short" Delta request, to see if there is a lot of data to process
              const params: any = { limit: NUM_ELEMENTS_WITHOUT_MANUAL_SYNC };
              if (this.lastSyncAt) params.since = this.lastSyncAt;
              this._API
                .getResource(this.teamId ? `teams/${this.teamId}/delta` : 'delta', { params })
                .then((delta: Delta): void => {
                  // decide if to proceed with the sync: in case there is another page, it requires a manual confirmation
                  if (delta.next && !manualConfirmation) {
                    this.requiresManualConfirmation = true;
                    this.synchronizing = false;
                    return resolve();
                  }
                  // save the records in the delta and request possible new pages
                  this.syncDeltaRecords(delta, (): void => {
                    if (this.errorInLastSync) {
                      this.synchronizing = false;
                      resolve();
                    } else {
                      // all the resources are succesfully in sync
                      this.resources.forEach(resource => (this.cacheableResources[resource].synchronizing = false));
                      // update the timestamp of last sync
                      this.saveLastSyncAt(now)
                        .then((): void => {
                          this.synchronizing = false;
                          resolve();
                        })
                        .catch((): void => {
                          // we couldn't save the last sync info
                          this.errorInLastSync = true;
                          this.synchronizing = false;
                          reject();
                        });
                    }
                  });
                })
                .catch((): void => {
                  // we couldn't acquire new information (Delta)
                  this.errorInLastSync = true;
                  this.synchronizing = false;
                  reject();
                });
            })
            .catch((): void => {
              // we stop, since we don't want backend data to override local info not yet uploaded
              this.errorInLastSync = true;
              this.synchronizing = false;
              reject();
            })
      );
    });
  }
  /**
   * Force a full synchronisation.
   */
  forceFullSync(): void {
    this._storage.clear().then((): Promise<void> => this.synchronize(true));
  }
}

/**
 * The description of an API request to a resource, to use with `IDEAAWSAPI`.
 * Used for queues of requests (UPLOAD).
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
  body: any;
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
 * The abstract class to implement for each resource to cache offline from the back-end (DOWNLOAD).
 */
export abstract class CacheableResource {
  /**
   * The team owning the resource.
   * If null, the project isn't teams-based.
   */
  teamId: string;
  /**
   * The identifier of the resource.
   */
  resource: DeltaResources | string;
  /**
   * The resource description (translated) for the UI.
   */
  description: string;
  /**
   * Runtime attribute to know if the resource is synchronizing.
   */
  synchronizing: boolean;
  /**
   * True if one of the elements failed the execution.
   */
  error: boolean;

  constructor(resource: string, description: string) {
    this.resource = resource;
    this.description = description;
    this.synchronizing = false;
    this.error = false;
    // loaded at runtime
    this.teamId = null;
  }

  /**
   * How to build the relative URL to the resource (list).
   * E.g. `teams/${element.teamId}/customers` or `customers`.
   */
  abstract listURL(element: any): string;
  /**
   * How to build the relative URL to the resource element (detail).
   * E.g. `teams/${element.teamId}/customers/${element.customerId}` or `customers/${element.customerId}`.
   */
  abstract elementURL(element: any): string;
  /**
   * How to uniquely identify an element in the list (by its ids).
   * E.g. `return list.findIndex(x => x.customerId === element.customerId);`
   */
  abstract findIndexInList(list: any[], element: any): number;
  /**
   * How to keep the list sorted.
   * E.g. `return a.name.localeCompare(b.name);`
   */
  abstract sort(a: any, b: any): number;
}
