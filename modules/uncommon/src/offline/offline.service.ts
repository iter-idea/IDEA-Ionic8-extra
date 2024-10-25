import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Network } from '@capacitor/network';

/**
 * Utility to monitor the network connection.
 * Note: don't use it directly, if you're also using IDEAOfflineDataService.
 */
@Injectable({ providedIn: 'root' })
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
   * The handler for listenig to network changes.
   */
  protected listenerHandler: any;

  constructor() {
    // get an instant status
    this._isOffline = !navigator.onLine;
    if (Network) {
      // set the basic listener for changes
      this.listenerHandler = Network.addListener(
        'networkStatusChange',
        status => (this._isOffline = !status.connected)
      );
      // create the observable to subscribe to the network changes; note: it won't run until subscribed
      this.observable = new Observable(observer => {
        // remove the basic listener add add one that supports a subscription
        Network.removeAllListeners();
        this.listenerHandler = Network.addListener('networkStatusChange', status => {
          this._isOffline = !status.connected;
          if (observer) observer.next(status.connected);
        });
      });
    }
  }
  /**
   * Subscribe to be notified when the connection status changes.
   */
  subscribe(callback: (isOnline: boolean) => void): Subscription {
    return this.observable.subscribe(callback);
  }

  /**
   * Quickly check the connection status.
   */
  isOnline(): boolean {
    return !this._isOffline;
  }
  /**
   * Quickly check the connection status.
   */
  isOffline(): boolean {
    return this._isOffline;
  }

  /**
   * Quickly check for online connection.
   */
  async check(): Promise<boolean> {
    if (!Network) return false;

    const status = await Network.getStatus();
    this._isOffline = !status.connected;
    return status.connected;
  }
}
