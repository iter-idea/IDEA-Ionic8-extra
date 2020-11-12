import { Component } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import Moment = require('moment-timezone');
import { Plugins } from '@capacitor/core';
const { CapacitorKeepScreenOn } = Plugins;

import { IDEAOfflineDataService, APIRequest } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAActionSheetController } from '../actionSheet/actionSheetController.service';

import { IDEADownloaderURL } from '../downloader/downloader.component';

@Component({
  selector: 'idea-offline-manager',
  templateUrl: 'offlineManager.component.html',
  styleUrls: ['offlineManager.component.scss']
})
export class IDEAOfflineManagerComponent {
  /**
   * Support variable to trigger file downloads.
   */
  public download: IDEADownloaderURL;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: IDEAActionSheetController,
    public offline: IDEAOfflineDataService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    Moment.locale(this.t.getCurrentLang());
  }

  /**
   * Run a synchronization (with manual confirmation), to acquire what's changed since the last one.
   */
  public sync() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA.OFFLINE.SYNC_NOW'),
        message: this.t._('IDEA.OFFLINE.DONT_EXIT_APP_DISCLAIMER'),
        buttons: [
          { text: this.t._('COMMON.CANCEL') },
          {
            text: this.t._('COMMON.GOT_IT'),
            handler: () => {
              // if the plugin is available, avoid the screen to turn off during the synchronisation
              if (CapacitorKeepScreenOn) CapacitorKeepScreenOn.enable();
              // run a manual synchronisation
              this.offline.synchronize(true).finally(() => {
                if (CapacitorKeepScreenOn) CapacitorKeepScreenOn.disable();
              });
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Smarter labeling based on a recent syncronization.
   */
  public getLastSyncLabel(): string {
    if (!this.offline.lastSyncAt) return this.t._('IDEA.OFFLINE.NEVER');
    const reasonableTime: number = 1000 * 60 * 5; // 5 minutes
    if (Date.now() < this.offline.lastSyncAt + reasonableTime) return this.t._('IDEA.OFFLINE.NOW');
    else return Moment.unix(this.offline.lastSyncAt / 1000).format('LL');
  }

  /**
   * Prompt for deletion of a erroneous request (stuck).
   */
  public deleteRequest(request: APIRequest) {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        message: this.t._('IDEA.OFFLINE.DELETION_IS_IRREVERSIBLE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL') },
          { text: this.t._('COMMON.CONFIRM'), handler: () => this.offline.deleteRequest(request) }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Download a log of the request (JSON file).
   */
  public downloadRequestLog(request: APIRequest) {
    const dataURL = window.URL.createObjectURL(new Blob([JSON.stringify(request)], { type: 'text/json' }));
    this.download = new IDEADownloaderURL(dataURL);
  }

  /**
   * Advanced actions.
   */
  public actions() {
    const buttons = [
      { text: this.t._('IDEA.OFFLINE.FORCE_FULL_SYNC'), icon: 'sync', handler: () => this.forceFullSync() },
      { text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' }
    ];
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA.OFFLINE.ADVANCED_ACTIONS'), buttons })
      .then(actions => actions.present());
  }

  /**
   * Force a full synchronisation, ignoring the local resources.
   */
  public forceFullSync() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA.OFFLINE.FORCE_FULL_SYNC'),
        subHeader: this.t._('COMMON.ARE_YOU_SURE'),
        message: this.t._('IDEA.OFFLINE.FULL_SYNC_DISCLAIMER'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          { text: this.t._('COMMON.CONFIRM'), handler: () => this.offline.forceFullSync() }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Close the component.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
