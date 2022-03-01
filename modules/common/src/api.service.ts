import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { environment as env } from '@env';

/**
 * To communicate with an AWS API Gateway istance.
 * Lighter, alternative version of _IDEAAWSAPIService_.
 */
@Injectable()
export class IDEAApiService {
  /**
   * The base URL to which to make requests.
   */
  baseURL = `https://${String(env.idea.api?.url)}/${String(env.idea.api?.stage)}`;
  /**
   * A reference to the current's app version.
   */
  appVersion = env.idea.app?.version || '?';

  /**
   * Passed as `Authorization` header.
   */
  authToken: string;
  /**
   * Passed as `X-API-Key` header.
   */
  apiKey: string;

  constructor(private platform: Platform) {}

  /**
   * Execute an online API request.
   * @param path resource path (e.g. `['users', userId]`)
   * @param method HTTP method
   * @param options the request options
   */
  private async request(
    path: string[] | string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    options: ApiRequestOptions = {}
  ): Promise<any> {
    const url = this.baseURL.concat('/', Array.isArray(path) ? path.join('/') : path);

    const headers: any = { ...options.headers };
    if (this.authToken) headers.Authorization = this.authToken;
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    const params =
      '?' +
      new URLSearchParams({
        _v: this.appVersion,
        _p: this.platform.platforms().join(' '),
        ...(options.params || {})
      }).toString();

    let body: any = null;
    if (options.body) body = JSON.stringify(body);

    const res = await fetch(url.concat(params), { method, headers, body });
    if (res.status === 200) return res.json();

    let errMessage: string;
    try {
      errMessage = (res.json() as any).message;
    } catch (err) {
      errMessage = 'Operation failed';
    }
    throw new Error(errMessage);
  }

  /**
   * GET request.
   */
  async getResource(path: string[] | string, options?: ApiRequestOptions): Promise<any> {
    return await this.request(path, 'GET', options);
  }

  /**
   * POST request.
   */
  async postResource(path: string[] | string, options?: ApiRequestOptions): Promise<any> {
    return await this.request(path, 'POST', options);
  }

  /**
   * PUT request.
   */
  async putResource(path: string[] | string, options?: ApiRequestOptions): Promise<any> {
    return await this.request(path, 'PUT', options);
  }

  /**
   * PATCH request.
   */
  async patchResource(path: string[] | string, options?: ApiRequestOptions): Promise<any> {
    return await this.request(path, 'PATCH', options);
  }

  /**
   * DELETE request.
   */
  async deleteResource(path: string[] | string, options?: ApiRequestOptions): Promise<any> {
    return await this.request(path, 'DELETE', options);
  }
}

/**
 * The options of an API request.
 */
interface ApiRequestOptions {
  /**
   * The additional headers of the request; `Authorization` and `X-API-Key` are included by default, if set.
   */
  headers?: { [key: string]: string | number | boolean };
  /**
   * The query parameters of the request.
   */
  params?: { [key: string]: string | number | boolean };
  /**
   * The body of the request.
   */
  body?: any;
}
