import { Observable, Subscription } from 'rxjs';
import { Injectable, NgZone, inject } from '@angular/core';

/**
 * To subscribe to the scan readings of DataWedge-compatible devices.
 *
 * It works through **intents**, so the namesake intent output must be enabled in the chosen profile.
 *
 * This service, inspired by the [ZebraIonicDemo repo](https://github.com/Zebra/ZebraIonicDemo) needs,
 * in order to work, the following plugin: `com-easystep2-datawedge-plugin-intent-cordova`.
 */
@Injectable({ providedIn: 'root' })
export class IDEADataWedgeReaderService {
  private ngZone = inject(NgZone);
  /**
   * To manage device's intents.
   */
  protected intent: IntentShim;
  /**
   * The observable for subscribing to the readings.
   */
  protected observable: Observable<ScanData>;

  initScanService(): Observable<ScanData> {
    return new Observable<ScanData>(observer => {
      const cordova = (window as any).cordova;

      const registerReceiver = (): void => {
        if (!this.intent) return observer.error('IntentShim plugin not available');

        // set up a broadcast receiver to listen for incoming scans
        this.intent.registerBroadcastReceiver(
          {
            filterActions: [
              // response from scan (needs to match value in output plugin)
              'com.iteridea.reader.ACTION',
              // response from DataWedge service (as defined by API)
              'com.symbol.datawedge.api.RESULT_ACTION'
            ],
            filterCategories: ['android.intent.category.DEFAULT']
          },
          (intent: any): void => {
            const extras = intent.extras;

            // extract the reading from the info returned by the device
            const ret = {
              data: extras['com.symbol.datawedge.data_string'],
              type: extras['com.symbol.datawedge.label_type'],
              timestamp: new Date().toLocaleTimeString()
            } as ScanData;
            // notify the subscribers that a reading happened
            this.ngZone.run(
              (): void => observer.next(ret) // Emit the scanned intent
            );
          }
        );
      };

      const onDeviceReady = (): void => {
        if (cordova?.platformId) registerReceiver();
        else observer.error('Cordova not ready or platformId missing');
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') onDeviceReady();
      else document.addEventListener('deviceready', onDeviceReady, { once: true });
    });
  }

  /**
   * Return true if the DataWedge-compatible device can be used.
   */
  isAvailable(): boolean {
    this.intent = (window as any).plugins?.intentShim;
    return Boolean(this.intent);
  }

  /**
   * Subscribe to the service to be notified when a reading happens.
   */
  subscribe(callback: (scan: ScanData) => void): Subscription {
    return this.observable.subscribe(callback);
  }

  /**
   * Trigger the start of a soft scan.
   */
  startScan(): void {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'START_SCANNING');
  }
  /**
   * Trigger the end of a soft scan.
   */
  stopScan(): void {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'STOP_SCANNING');
  }
  /**
   * Send a broadcast intent to the DataWedge service.
   * This requires DW6.3+ as that is the version where the `com.symbol.datawedge.api.ACTION` was introduced.
   */
  protected sendCommandToDevice(name: string, value: any): void {
    if (!this.intent) return;
    this.intent.sendBroadcast(
      {
        action: 'com.symbol.datawedge.api.ACTION',
        extras: { [name]: value, SEND_RESULT: true }
      },
      // success and failure in sending the intent, not of DW to process the intent
      (): void => {},
      (): void => {}
    );
  }
}

/**
 * Interface to manage the intentShim plugin and ensure type safety.
 * Note: Cordova plugins are injected into the global window object at runtime.
 */
interface IntentShim {
  sendBroadcast(options: any, onSuccess?: Function, onError?: Function): void;
  registerBroadcastReceiver(
    filters: { filterActions: string[]; filterCategories: string[] },
    callback: (intent: any) => void
  ): void;
}

/**
 * Interface to manage scan data from the barcode reader.
 */
export interface ScanData {
  data: string;
  type: string;
  timestamp: string;
}
