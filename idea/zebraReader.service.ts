import { Injectable } from '@angular/core';
import { Events, Platform } from '@ionic/angular';

/**
 * To acquire the scan readings of a Zebra devices; listen for `zebra:scan` Ionic events.
 *
 * It works through **intents**, so the namesake output must be enabled in the chosen profile.
 *
 * This service, inspired by the [ZebraIonicDemo repo](https://github.com/Zebra/ZebraIonicDemo)
 * needs, in order to work, the following plugin: `com-darryncampbell-cordova-plugin-intent`.
 */
@Injectable()
export class IDEAZebraReaderService {
  /**
   * To manage device's intents.
   */
  protected intent: any;

  constructor(protected events: Events, protected platform: Platform) {
    this.platform.ready()
    .then(() => {
      // load the intent manager
      this.intent = (<any>window).plugins ? (<any>window).plugins.intentShim : null;
      if (!this.intent) return;
      // set up a broadcast receiver to listen for incoming scans
      this.intent.registerBroadcastReceiver({
        filterActions: [
          // response from scan (needs to match value in output plugin)
          'com.zebra.iteridea.ACTION',
          // response from DataWedge service (as defined by API)
          'com.symbol.datawedge.api.RESULT_ACTION'
        ],
        filterCategories: [
          'android.intent.category.DEFAULT'
        ]
      }, (intent: any) => {
        // extract the reading from the info returned by the device
        const ret = <ScanData> {
          data: intent.extras['com.symbol.datawedge.data_string'],
          type: intent.extras['com.symbol.datawedge.label_type'],
          timestamp: new Date().toLocaleTimeString()
        };
        this.events.publish('zebra:scan', ret);
      });
    });
  }

  /**
   * Return true if the Zebra device can be used.
   */
  public isAvailable(): boolean {
    return Boolean(this.intent);
  }

  /**
   * Trigger the start of a soft scan.
   */
  public startScan(): void {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'START_SCANNING');
  }
  /**
   * Trigger the end of a soft scan.
   */
  public stopScan(): void {
    this.sendCommandToDevice('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'STOP_SCANNING');
  }
  /**
   * Send a broadcast intent to the DW service which is present on all Zebra devices.
   * This functionality requires DW6.3+ as that is the version where the
   * `com.symbol.datawedge.api.ACTION` was introduced.
   */
  private sendCommandToDevice(name: string, value: string) {
    if (!this.intent) return;
    this.intent.sendBroadcast({
      action: 'com.symbol.datawedge.api.ACTION',
      extras: { [name]: value, 'SEND_RESULT': true }
    },
      // success and failure in sending the intent, not of DW to process the intent
      () => {}, () => {}
    );
  }
}

export interface ScanData {
  data: string;
  type: string;
  timestamp: string;
}
