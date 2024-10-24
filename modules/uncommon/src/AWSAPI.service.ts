import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Platform } from '@ionic/angular';
import { IDEAEnvironment, IDEAStorageService } from '@idea-ionic/common';

import { IDEAErrorReportingService } from './errorReporting.service';
import { IDEATinCanService } from './tinCan.service';
import { IDEAOfflineService } from './offline/offline.service';

/**
 * To communicate with an AWS's API Gateway istance.
 *
 * Includes a rundimental cache on GET requests, until Android doesn't support SWs on local files.
 *
 * Note: requires an `AWSAPIAuthToken` variable to be set by IDEATinCanService service.
 */
@Injectable()
export class IDEAAWSAPIService {
  protected _env = inject(IDEAEnvironment);
  protected _http = inject(HttpClient);
  protected _platform = inject(Platform);
  protected _tc = inject(IDEATinCanService);
  protected _storage = inject(IDEAStorageService);
  protected _errorReporting = inject(IDEAErrorReportingService);
  protected _offline = inject(IDEAOfflineService);

  apiStage: string;
  apiUrlProject: string;
  ideaApiStage: string;
  apiUrlIDEA: string;

  constructor() {
    this.apiStage = this._env.idea.api?.stage || (this._env.idea.api as any)?.version;
    this.apiUrlProject = 'https://'.concat([this._env.idea.api?.url, this.apiStage].filter(x => x).join('/'));
    this.ideaApiStage = this._env.idea.ideaApi?.stage || (this._env.idea.ideaApi as any)?.version;
    this.apiUrlIDEA = 'https://'.concat([this._env.idea.ideaApi?.url, this.ideaApiStage].filter(x => x).join('/'));
  }

  /**
   * Execute an online API request.
   * @param resource resource name (e.g. `users`)
   * @param method enum HTTP methods
   * @param options the request options
   */
  protected request(resource: string, method: string, options?: APIRequestOption): Promise<any> {
    return new Promise((resolve, reject) => {
      const opt = options || {};
      // prepare the url
      const url = this.prepareURL(resource, opt);
      // prepare the headers and set the Authorization token
      const headers = this.prepareHeaders(opt.headers);
      // prepare the query params and add some info about the client
      const params = this.prepareQueryParams(opt.params, true);
      // execute the request
      let req: any;
      switch (method) {
        case 'HEAD':
          req = this._http.head(url, { headers, params });
          break;
        case 'POST':
          req = this._http.post(url, opt.body, { headers, params });
          break;
        case 'PUT':
          req = this._http.put(url, opt.body, { headers, params });
          break;
        case 'PATCH':
          req = this._http.patch(url, opt.body, { headers, params });
          break;
        case 'DELETE':
          req = this._http.delete(url, { headers, params });
          break;
        case 'GET':
        default:
          req = this._http.get(url, { headers, params });
      }
      // handle the request response
      req.subscribe(
        (res: any) => resolve(res),
        async (err: HttpErrorResponse) => {
          // check if the request failed for network reasons (to trigger offline mode if needed)
          await this._offline.check();
          // (async) send a report, if wanted
          if (opt.reportError) this._errorReporting.sendReport(err);
          // fix and return the error
          this.fixErrMessageBeforeReject(err, reject);
        }
      );
    });
  }
  /**
   * Prepare the URL to which execute the request.
   */
  protected prepareURL(resource: string, opt: APIRequestOption): string {
    // decide whether to use IDEA's API or the project's API (or an alternative API)
    let url = opt.idea ? this.apiUrlIDEA : opt.alternativeAPI || this.apiUrlProject;
    // prepare a single-resource request (by id) or a normal one
    url = `${url}/${resource}`;
    if (opt.resourceId) url = `${url}/${encodeURIComponent(opt.resourceId)}`;
    return url;
  }
  /**
   * Prepare the headers object to send with a request.
   * Note: it always adds the Authorization token (`AWSAPIAuthToken`) and the API key (`AWSAPIKey`), if set.
   */
  protected prepareHeaders(h: HttpHeaders | any): HttpHeaders {
    // preare the headers; note: HttpHeaders is immutable!
    let headers = new HttpHeaders(h || null);
    // set the Authorization token
    if (!headers.get('Authorization') && this._tc.get('AWSAPIAuthToken'))
      headers = headers.set('Authorization', this._tc.get('AWSAPIAuthToken'));
    // set the API key
    if (!headers.get('X-API-Key') && this._tc.get('AWSAPIKey'))
      headers = headers.set('X-API-Key', this._tc.get('AWSAPIKey'));
    return headers;
  }
  /**
   * Prepare the queryParams object to send with a request; if requested, add some info about the client.
   */
  protected prepareQueryParams(qp: HttpParams | any, addClientInfo?: boolean): HttpParams {
    // prepare the query params; note: HttpParams is immutable!
    let searchParams = new HttpParams();
    if (qp && qp instanceof HttpParams) searchParams = qp;
    else if (qp) for (const prop in qp) if (qp[prop]) searchParams = searchParams.set(prop, qp[prop]);
    // if requested, add app version and client platform to the info we send to the back-end
    if (addClientInfo) {
      searchParams = searchParams.set('_v', this._env.idea.app.version);
      searchParams = searchParams.set('_p', this._platform.platforms().join(' '));
    }
    return searchParams;
  }
  /**
   * Converts the error message to be readable.
   */
  protected fixErrMessageBeforeReject(err: HttpErrorResponse, reject: any) {
    let e;
    try {
      if (!err || !err.error) e = {};
      else if (typeof err.error === 'string') e = JSON.parse(err.error);
      else e = err.error;
    } catch (_) {
      e = {};
    }
    reject(new Error(e.message || 'Unknown error!'));
  }

  /**
   * Use the HttpClient to execute a raw request.
   */
  rawRequest(): HttpClient {
    return this._http;
  }

  /**
   * HEAD request.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  headResource(resource: string, options?: APIRequestOption): Promise<any> {
    return this.request(resource, 'HEAD', options);
  }

  /**
   * GET request. Include options to cache the requests (`options.useCache`), to work also offline.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  getResource(resource: string, options?: APIRequestOption): Promise<any> {
    return new Promise((resolve, reject) => {
      const opt = options || {};
      // if offline and with a cache mode set, force the request to the cache
      if (!navigator.onLine && opt.useCache) opt.useCache = CacheModes.CACHE_ONLY;
      // execute the GET request online or through the cache, depending on the chosen mode
      switch (opt.useCache) {
        case CacheModes.CACHE_ONLY:
          // return the result from the cache, without retrying online if a result wasn't found
          this.getFromCache(resource, opt).then((res: any) => {
            if (res) resolve(res);
            else reject();
          });
          break;
        case CacheModes.CACHE_FIRST:
          // return the result from the cache
          this.getFromCache(resource, opt).then((localRes: any) => {
            // check whether the local resource is present (element or list)
            if (localRes && (opt.resourceId || localRes.length)) {
              resolve(localRes);
              // asynchrounously execute the request online, to update the cache with latest data
              this.request(resource, 'GET', opt)
                .then((cloudRes: any) => {
                  // update the cache (if it fails, it's ok)
                  this.putInCache(resource, cloudRes, opt).catch(() => {});
                })
                .catch(() => {}); // we already returned the result, an error is acceptable
            } else {
              // if the result isn't found in the cache, return the result of the online request
              this.request(resource, 'GET', opt)
                .then((res: any) => {
                  resolve(res);
                  // update the cache (if it fails, it's ok)
                  this.putInCache(resource, res, opt).catch(() => {});
                })
                .catch((err: Error) => reject(err)); // element not found
            }
          });
          break;
        case CacheModes.NETWORK_FIRST:
          // return the result from an online request
          this.request(resource, 'GET', opt)
            .then((cloudRes: any) => {
              resolve(cloudRes);
              // asynchrounously get the same element from cache and decide whether to update or not
              this.getFromCache(resource, opt).then(() => {
                // update the cache (if it fails, it's ok)
                this.putInCache(resource, cloudRes, opt).catch(() => {});
              });
            })
            .catch(() => {
              // if a request to the network fails, check in cache
              this.getFromCache(resource, opt).then((res: any) => {
                if (res) resolve(res);
                else reject();
              });
            });
          break;
        default:
          /* CacheModes.NO_CACHE */
          // return the result from an online request, with no cache involved
          this.request(resource, 'GET', opt)
            .then((res: any) => resolve(res))
            .catch((err: Error) => reject(err));
      }
    });
  }

  /**
   * Observe a GET request. Include options to cache the requests (`options.useCache`), to work also offline.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  getResourceObserver(resource: string, options?: APIRequestOption): Observable<any> {
    return new Observable(observer => {
      const opt = options || {};
      // if offline and with a cache mode set, force the request to the cache
      if (!navigator.onLine && opt.useCache) opt.useCache = CacheModes.CACHE_ONLY;
      // execute the GET request online or through the cache, depending on the chosen mode
      switch (opt.useCache) {
        case CacheModes.CACHE_ONLY:
          // return the result from the cache, without retrying online if a result wasn't found
          this.getFromCache(resource, opt).then((res: any) => {
            if (res) observer.next(res);
            else observer.error();
          });
          break;
        case CacheModes.CACHE_FIRST:
          // return the result from the cache
          this.getFromCache(resource, opt).then((localRes: any) => {
            if (localRes) {
              observer.next(localRes);
              // asynchrounously execute the request online, to update the cache with latest data
              this.request(resource, 'GET', opt)
                .then((cloudRes: any) => {
                  observer.next(cloudRes);
                  // update the cache (if it fails, it's ok)
                  this.putInCache(resource, cloudRes, opt).catch(() => {});
                })
                .catch(() => {}); // we already returned the result, an error is acceptable
            } else {
              // if the result isn't found in the cache, return the result of the online request
              this.request(resource, 'GET', opt)
                .then((res: any) => {
                  observer.next(res);
                  // update the cache (if it fails, it's ok)
                  this.putInCache(resource, res, opt).catch(() => {});
                })
                .catch((err: Error) => observer.error(err)); // element not found
            }
          });
          break;
        case CacheModes.NETWORK_FIRST:
          // return the result from an online request
          this.request(resource, 'GET', opt)
            .then((cloudRes: any) => {
              observer.next(cloudRes);
              // update the cache (if it fails, it's ok)
              this.putInCache(resource, cloudRes, opt).catch(() => {});
            })
            .catch(() => {
              // if a request to the network fails, check in cache
              this.getFromCache(resource, opt).then((res: any) => {
                if (res) observer.next(res);
                else observer.error();
              });
            });
          break;
        default:
          /* CacheModes.NO_CACHE */
          // return the result from an online request, with no cache involved
          this.request(resource, 'GET', opt)
            .then((res: any) => observer.next(res))
            .catch((err: Error) => observer.error(err));
      }
    });
  }

  /**
   * Execute a GET request from the local storage.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  getFromCache(resource: string, options?: APIRequestOption): Promise<any> {
    return new Promise(resolve => {
      const opt = options || {};
      // prepare the url and the query params
      const url = this.prepareURL(resource, opt);
      const queryParams = this.prepareQueryParams(opt.params);
      // get from storage, by the complete url
      this._storage
        .get(url.concat(queryParams.toString()))
        .then((res: any) => (res ? resolve(res) : opt.resourceId ? resolve(null) : resolve([])));
    });
  }
  /**
   * Execute a PUT request in the local storage.
   * @param resource resource name (e.g. `users`)
   * @param data resource data
   * @param options the request options
   */
  putInCache(resource: string, data: any, options?: APIRequestOption): Promise<void> {
    return new Promise((resolve, reject) => {
      const opt = options || {};
      // prepare the url and the query params
      const url = this.prepareURL(resource, opt);
      const queryParams = this.prepareQueryParams(opt.params);
      // put in the storage, by the complete url
      this._storage
        .set(url.concat(queryParams.toString()), data)
        .then(() => resolve())
        .catch((err: Error) => reject(err));
    });
  }
  /**
   * Execute a DELETE request in the local storage.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  deleteFromCache(resource: string, options?: APIRequestOption): Promise<void> {
    return new Promise((resolve, reject) => {
      const opt = options || {};
      // prepare the url and the query params
      const url = this.prepareURL(resource, opt);
      const queryParams = this.prepareQueryParams(opt.params);
      // delete from storage, by the complete url
      this._storage
        .remove(url.concat(queryParams.toString()))
        .then(() => resolve())
        .catch((err: Error) => reject(err));
    });
  }

  /**
   * POST request.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  postResource(resource: string, options?: APIRequestOption): Promise<any> {
    return this.request(resource, 'POST', options);
  }

  /**
   * PUT request.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  putResource(resource: string, options?: APIRequestOption): Promise<any> {
    return this.request(resource, 'PUT', options);
  }

  /**
   * PATCH request.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  patchResource(resource: string, options?: APIRequestOption): Promise<any> {
    return this.request(resource, 'PATCH', options);
  }

  /**
   * DELETE request.
   * @param resource resource name (e.g. `users`)
   * @param options the request options
   */
  deleteResource(resource: string, options?: APIRequestOption): Promise<any> {
    return this.request(resource, 'DELETE', options);
  }
}

/**
 * The options of an API request.
 */
export class APIRequestOption {
  /**
   * To identify a specific resource by id.
   */
  resourceId?: string;
  /**
   * The query parameters of the request.
   */
  params?: any;
  /**
   * The body of the request.
   */
  body?: any;
  /**
   * The additional headers of the request; `Authorization` is included by default.
   */
  headers?: any;
  /**
   * Which mode to use to take advance of the requests caching mechanism.
   */
  useCache?: CacheModes;
  /**
   * If true, report the errors that occurs during the request.
   */
  reportError?: boolean;
  /**
   * If true, use IDEA's API instead of the project's API).
   */
  idea?: boolean;
  /**
   * If `idea` is not set, set this to use an alternative API URL for the request.
   */
  alternativeAPI?: string;
}

/**
 * Set of usable cache modes.
 */
export enum CacheModes {
  /**
   * Return the result from an online request, with no cache involved.
   */
  NO_CACHE = 0,
  /**
   * Return the result from an online request, storing the result in the cache, to update it with the latest data.
   */
  NETWORK_FIRST,
  /**
   * Return the result from the cache, but also execute the request online, to update the cache with the latest data.
   */
  CACHE_FIRST,
  /**
   * Return the result from the cache, without retrying online if a result wasn't found.
   */
  CACHE_ONLY
}
