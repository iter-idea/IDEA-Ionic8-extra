import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs';
import Async = require('async');
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService, APIRequestOption } from '../AWSAPI.service';
import { IDEAOfflineService } from './offline.service';
import { IDEATranslationsService } from '../translations/translations.service';

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
@Injectable()
export class IDEAOfflineDataService {
  /**
   * True when running a synchronization.
   */
  public synchronizing: boolean;
  /**
   * The timestamp of the last synchronization.
   */
  public lastSyncAt: IdeaX.epochDateTime;
  /**
   * True if an error happened in the last synchronization.
   */
  public errorInLastSync: boolean;
  /**
   * True if the synchronisation is too vast and so require a manual action of the user.
   */
  public requiresManualConfirmation: boolean;
  /**
   * If false, ignore the entire upload scenario.
   */
  public useQueueAPIRequests: boolean;
  /**
   * The array of the requests not executed because we are/were offline; they need to run once online.
   */
  public queueAPIRequests: Array<APIRequest>;

  /**
   * The id of the team of which to manage data offline.
   */
  protected teamId: string;
  /**
   * The array of DeltaResources to cache offline.
   */
  protected resources: Array<IdeaX.DeltaResources | string>;
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

  constructor(
    protected storage: Storage,
    protected t: IDEATranslationsService,
    protected offline: IDEAOfflineService,
    protected API: IDEAAWSAPIService
  ) {
    this.queueAPIRequests = new Array<APIRequest>();
    this.resources = new Array<string>();
    this.cacheableResources = {};
    // subscribe to network changes
    this.offline.subscribe(isOnline => {
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
  public isOnline(): boolean {
    return this.offline.isOnline();
  }
  /**
   * Quickly check the connection status.
   */
  public isOffline(): boolean {
    return this.offline.isOffline();
  }
  /**
   * Subscribe to the service to be notified when the connection status changes.
   */
  public subscribe(callback: (isOnline: boolean) => void): Subscription {
    return this.offline.subscribe(callback);
  }
  /**
   * Quickly check for online connection.
   */
  public check(): Promise<boolean> {
    return this.offline.check();
  }

  //
  // CONFIGURATION
  //

  /**
   * Whether the offline mode is allowed. You can customize this function, if needed.
   */
  public isAllowed() {
    return this.teamId && this.resources.length;
  }
  /**
   * Set up the service to use and sync offline data.
   */
  public setUpOfflineData(teamId: string, useQueueAPIRequests: boolean, cacheableResources: Array<CacheableResource>) {
    // set the team
    this.teamId = teamId;
    // decide if to allow certain API request while offline
    this.useQueueAPIRequests = useQueueAPIRequests;
    // load the API request pending queue, if any
    this.queueAPIRequestKey = `${QUEUE_API_REQUESTS_KEY}_${this.teamId}`;
    this.loadQueueAPIRequest();
    // load the lastSyncAt information for the team
    this.lastSyncKey = `${LAST_SYNC_KEY}_${this.teamId}`;
    this.loadLastSyncAt();
    // load the cacheable resources
    this.resources = new Array<IdeaX.DeltaResources | string>();
    this.cacheableResources = {};
    cacheableResources.forEach(r => this.addCacheableResource(r));
  }
  /**
   * Load from the local storage the last sync at information.
   */
  protected loadLastSyncAt(): Promise<number> {
    return new Promise(resolve => {
      this.storage.get(this.lastSyncKey).then((lastSyncAt: number) => {
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
    return this.storage.set(this.lastSyncKey, lastSyncAt);
  }
  /**
   * Add a CacheableResource.
   */
  protected addCacheableResource(cacheableResource: CacheableResource) {
    this.cacheableResources[cacheableResource.resource] = cacheableResource;
    this.resources.push(cacheableResource.resource);
  }
  /**
   * Remove a CacheableResource by its DeltaResource.
   */
  protected removeCacheableResource(resource: IdeaX.DeltaResources | string) {
    delete this.cacheableResources[resource];
    this.resources.splice(this.resources.indexOf(resource), 1);
  }
  /**
   * Get the the DeltaResourced configured.
   */
  public getResources(): Array<IdeaX.DeltaResources | string> {
    return this.resources;
  }
  /**
   * Get a CacheableResource by its DeltaResource.
   */
  public getCacheableResource(resource: IdeaX.DeltaResources | string): CacheableResource {
    return this.cacheableResources[resource];
  }

  //
  // UPLOAD
  //

  /**
   * Execute all the API requests in the queue; the requests terminated with an error will remain in the queue.
   */
  protected runQueueAPIRequests(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.useQueueAPIRequests || this.isOffline() || !this.queueAPIRequests.length) return resolve();
      Async.eachSeries(
        this.queueAPIRequests,
        (request: APIRequest, doneReq: any) => {
          const options: APIRequestOption = {};
          if (request.resourceId) options.resourceId = request.resourceId;
          if (request.body) options.body = request.body;
          let promise: Promise<any>;
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
      this.storage.get(this.queueAPIRequestKey).then((queue: Array<APIRequest>) => {
        this.queueAPIRequests = queue || [];
        resolve(this.queueAPIRequests);
      });
    });
  }
  /**
   * Update the queue in memory and also save the copy in the local storage.
   */
  public saveQueueAPIRequest(queue?: Array<APIRequest>): Promise<void> {
    if (!this.isAllowed()) return Promise.reject();
    this.queueAPIRequests = queue || this.queueAPIRequests;
    return this.storage.set(this.queueAPIRequestKey, this.queueAPIRequests);
  }
  /**
   * Delete a request stuck in an error.
   */
  public deleteRequest(request: APIRequest) {
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
  protected async syncDeltaRecords(delta: IdeaX.Delta, done?: any) {
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
      const params: any = { next: delta.next };
      if (this.lastSyncAt) params.since = this.lastSyncAt;
      const newDelta = await this.API.getResource(`teams/${this.teamId}/delta`, { params });
      this.syncDeltaRecords(newDelta, done);
    } catch (err) {
      // if something went wrong, stops the operation, since we need to make sure the entire flow is consistent
      this.errorInLastSync = true;
      return done();
    }
  }
  /**
   * Save offline a list of DeltaRecords for this resource, creating a map of all the corresponding API GET requests.
   * Disclaimer: not very efficient, but it ensures the same lists aren't updated in conconcurrency.
   */
  protected async syncResourceDeltaRecords(resource: string, records: Array<IdeaX.DeltaRecord>): Promise<boolean> {
    // acquire the info an a cacheable resource
    const cr = this.cacheableResources[resource];
    if (!cr) return Promise.resolve(false);
    try {
      for (const r of records) {
        // calculate the URLs to access the API request key for this element and its list
        const listURL = cr.listURL(r.element);
        const elementURL = cr.elementURL(r.element);
        // get the list of (old) elements from the local storage by the calculated URL
        let list = await this.API.getFromCache(listURL);
        // find in the list the (old) element we want to manage
        const index = cr.findIndexInList(list, r.element);
        // delete the (old) element from the list
        if (index !== -1) list.splice(index, 1);
        // if the element wasn't the deleted (following the delta record information), insert the new version
        if (!r.deleted) list.push(r.element);
        // re-sort the list; note: it should be sorted from the last time, so we only manage the new element
        list = list.sort(cr.sort);
        // save the updated list
        await this.API.putInCache(listURL, list);
        // if the element was deleted, delete its corresponding API GET request
        if (r.deleted) await this.API.deleteFromCache(elementURL);
        // otherwise, update it
        else await this.API.putInCache(elementURL, r.element);
      }
    } catch (err) {
      // if something went wrong, stops the operation, since we need to make sure the entire flow is consistent
      cr.error = true;
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  //
  // SYNCHRONISATION (UPLOAD+DOWNLOAD)
  //

  /**
   * Run a sync, but only if needed, i.e. the cached content expired or we have pending API requests in the queue.
   */
  public synchronizeIfNeeded(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAllowed()) return reject();
      this.loadLastSyncAt().then(() =>
        this.loadQueueAPIRequest()
          .then(() => {
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
   * Note: it's an async execution, monitored by internal status attributes (`synchronizing`, `errorInLastSync`, etc.).
   * @param manualConfirmation if true, the request comes directly from a user action (not automatic procedures).
   */
  public async synchronize(manualConfirmation?: boolean) {
    if (!this.isAllowed() || this.synchronizing) return;
    this.synchronizing = true;
    this.errorInLastSync = false;
    this.requiresManualConfirmation = false;
    // load the lastSyncAt information
    this.loadLastSyncAt().then(() =>
      // try to run all the pending API requests in the queue, i.e. uploading the offline resources changed
      this.runQueueAPIRequests()
        .then(() => {
          // set this moment in time, so that if anything happened before the end of the sync, we don't lose fresh data
          const now = Date.now();
          // prepare a first "short" Delta request, to see if there is a lot of data to process
          const params: any = { limit: NUM_ELEMENTS_WITHOUT_MANUAL_SYNC };
          if (this.lastSyncAt) params.since = this.lastSyncAt;
          this.API.getResource(`teams/${this.teamId}/delta`, { params })
            .then((delta: IdeaX.Delta) => {
              // decide if to proceed with the sync: in case there is another page, it requires a manual confirmation
              if (delta.next && !manualConfirmation) {
                this.requiresManualConfirmation = true;
                this.synchronizing = false;
                return;
              }
              // save the records in the delta and request possible new pages
              this.syncDeltaRecords(delta, () => {
                if (this.errorInLastSync) this.synchronizing = false;
                else {
                  // all the resources are succesfully in sync
                  this.resources.forEach(resource => (this.cacheableResources[resource].synchronizing = false));
                  // update the timestamp of last sync
                  this.saveLastSyncAt(now).then(() => (this.synchronizing = false));
                }
              });
            })
            .catch(() => {
              // we couldn't acquire new information (Delta)
              this.errorInLastSync = true;
              this.synchronizing = false;
            });
        })
        .catch(() => {
          // we stop, since we don't want backend data to override local info not yet uploaded
          this.errorInLastSync = true;
          this.synchronizing = false;
        })
    );
  }
  /**
   * Force a full synchronisation.
   */
  public forceFullSync() {
    this.saveLastSyncAt(null).then(() => this.synchronize(true));
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
 * The abstract class to implement for each resource to cache offline from the back-end (DOWNLOAD).
 */
export abstract class CacheableResource {
  /**
   * The identifier of the resource.
   */
  public resource: IdeaX.DeltaResources | string;
  /**
   * The resource description (translated) for the UI.
   */
  public description: string;
  /**
   * Runtime attribute to know if the resource is synchronizing.
   */
  public synchronizing: boolean;
  /**
   * True if one of the elements failed the execution.
   */
  public error: boolean;

  constructor(resource: string, description: string) {
    this.resource = resource;
    this.description = description;
    this.synchronizing = false;
    this.error = false;
  }

  /**
   * How to build the relative URL to the resource (list).
   * E.g. `teams/${element.teamId}/customers`
   */
  public abstract listURL(element: any): string;
  /**
   * How to build the relative URL to the resource element (detail).
   * E.g. `teams/${element.teamId}/customers/${element.customerId}`
   */
  public abstract elementURL(element: any): string;
  /**
   * How to uniquely identify an element in the list (by its ids).
   * E.g. `return list.findIndex(x => x.customerId === element.customerId);`
   */
  public abstract findIndexInList(list: Array<any>, element: any): number;
  /**
   * How to keep the list sorted.
   * E.g. `return a.name.localeCompare(b.name);`
   */
  public abstract sort(a: any, b: any): number;
}
