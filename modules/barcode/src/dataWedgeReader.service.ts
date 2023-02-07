import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';

/**
 * To subscribe to the scan readings of DataWedge-compatible devices.
 *
 * It works through **intents**, so the namesake intent output must be enabled in the chosen profile.
 *
 * This service, inspired by the [ZebraIonicDemo repo](https://github.com/Zebra/ZebraIonicDemo) needs,
 * in order to work, the following plugin: `com-darryncampbell-cordova-plugin-intent`.
 */
@Injectable({ providedIn: 'root' })
export class IDEADataWedgeReaderService {
  /**
   * To manage device's intents.
   */
  protected intent: any;
  /**
   * The observable for subscribing to the readings.
   */
  protected observable: Observable<ScanData>;

  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      // load the intent manager
      this.intent = (window as any).plugins ? (window as any).plugins.intentShim : null;
      if (!this.intent) return;
      // create the observable to subscribe to the readings
      this.observable = new Observable(observer => {
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
          (intent: any) => {
            // extract the reading from the info returned by the device
            const ret = {
              data: intent.extras['com.symbol.datawedge.data_string'],
              type: intent.extras['com.symbol.datawedge.label_type'],
              timestamp: new Date().toLocaleTimeString()
            } as ScanData;
            // notify the subscribers that a reading happened
            observer.next(ret);
          }
        );
      });
    });
  }

  /**
   * Return true if the DataWedge-compatible device can be used.
   */
  public isAvailable(): boolean {
    return Boolean(this.intent);
  }

  /**
   * Subscribe to the service to be notified when a reading happens.
   */
  public subscribe(callback: (scan: ScanData) => void): Subscription {
    return this.observable.subscribe(callback);
  }

  /**
   * Trigger the start of a soft scan.
   */
  public startScan() {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'START_SCANNING');
  }
  /**
   * Trigger the end of a soft scan.
   */
  public stopScan() {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'STOP_SCANNING');
  }
  /**
   * Send a broadcast intent to the DataWedge service.
   * This requires DW6.3+ as that is the version where the `com.symbol.datawedge.api.ACTION` was introduced.
   */
  protected sendCommandToDevice(name: string, value: string) {
    if (!this.intent) return;
    this.intent.sendBroadcast(
      {
        action: 'com.symbol.datawedge.api.ACTION',
        extras: { [name]: value, SEND_RESULT: true }
      },
      // success and failure in sending the intent, not of DW to process the intent
      () => {},
      () => {}
    );
  }
}

export interface ScanData {
  data: string;
  type: string;
  timestamp: string;
}
