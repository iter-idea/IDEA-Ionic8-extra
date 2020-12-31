import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';

// from idea-config.js
declare const IDEA_API_IDEA_ID: string;
declare const IDEA_API_IDEA_REGION: string;
declare const IDEA_API_IDEA_VERSION: string;

const API_URL_IDEA =
  `https://${IDEA_API_IDEA_ID}.execute-api.${IDEA_API_IDEA_REGION}.amazonaws.com/` + `${IDEA_API_IDEA_VERSION}`;

/**
 * Utility to monitor the network connection.
 * Note: don't use it directly, if you're also using IDEAOfflineDataService.
 */
@Injectable()
export class IDEAOfflineService {
  /**
   * True/false if the platform is offline/online.
   */
  protected _isOffline: boolean;
  /**
   * The observable for subscribing to online/offline status changes.
   */
  protected observable: Observable<boolean>;
  /**
   * The handler for the repeated connection check in the background.
   */
  protected intervalHandler: any;

  constructor(protected http: HttpClient) {
    this._isOffline = !navigator.onLine;
    // create the observable to subscribe to the network changes
    this.observable = new Observable(observer => {
      window.addEventListener('online', () => {
        this.setOffline(false);
        observer.next(true);
      });
      window.addEventListener('offline', () => {
        this.setOffline(true);
        observer.next(false);
      });
    });
    // run a connection test every once in a while
    this.runContinousCheck();
  }

  /**
   * Quickly check the connection status.
   */
  public isOnline(): boolean {
    return !this._isOffline;
  }
  /**
   * Quickly check the connection status.
   */
  public isOffline(): boolean {
    return this._isOffline;
  }
  /**
   * Quickly set both the helpers that determs the connection status.
   */
  protected setOffline(isOffline: boolean) {
    const changed = this._isOffline !== isOffline;
    if (changed) {
      this._isOffline = isOffline;
      window.dispatchEvent(new Event(isOffline ? 'offline' : 'online'));
      this.runContinousCheck(isOffline ? 20 : 60);
    }
  }

  /**
   * Subscribe to the service to be notified when the connection status changes.
   */
  public subscribe(callback: (isOnline: boolean) => void): Subscription {
    return this.observable.subscribe(callback);
  }

  /**
   * Quickly check for online connection.
   */
  public check(): Promise<boolean> {
    return new Promise(resolve =>
      // note: it doesn't use this.API to avoid loops
      this.http
        .head(API_URL_IDEA.concat('/online'))
        .toPromise()
        .then(() => {
          this.setOffline(false);
          resolve(true);
        })
        .catch(() => {
          this.setOffline(true);
          resolve(false);
        })
    );
  }

  /**
   * Run a connection test every once in a while.
   */
  protected runContinousCheck(interval?: number) {
    interval = interval || 60;
    if (this.intervalHandler) clearInterval(this.intervalHandler);
    this.intervalHandler = setInterval(() => this.check(), interval * 1000);
  }
}
