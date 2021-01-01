import { Component } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { CapacitorKeepScreenOn, Browser } = Plugins;

import { IDEAOfflineDataService, APIRequest } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAActionSheetController } from '../actionSheet/actionSheetController.service';

@Component({
  selector: 'idea-offline-manager',
  templateUrl: 'offlineManager.component.html',
  styleUrls: ['offlineManager.component.scss']
})
export class IDEAOfflineManagerComponent {
  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: IDEAActionSheetController,
    public offline: IDEAOfflineDataService,
    public t: IDEATranslationsService
  ) {}

  /**
   * Run a synchronization (with manual confirmation), to acquire what's changed since the last one.
   */
  public sync() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_COMMON.OFFLINE.SYNC_NOW'),
        message: this.t._('IDEA_COMMON.OFFLINE.DONT_EXIT_APP_DISCLAIMER'),
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
   * Prompt for deletion of a erroneous request (stuck).
   */
  public deleteRequest(request: APIRequest) {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        message: this.t._('IDEA_COMMON.OFFLINE.DELETION_IS_IRREVERSIBLE'),
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
    Browser.open({ url: dataURL });
  }

  /**
   * Advanced actions.
   */
  public actions() {
    const buttons = [
      { text: this.t._('IDEA_COMMON.OFFLINE.FORCE_FULL_SYNC'), icon: 'sync', handler: () => this.forceFullSync() },
      { text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' }
    ];
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_COMMON.OFFLINE.ADVANCED_ACTIONS'), buttons })
      .then(actions => actions.present());
  }

  /**
   * Force a full synchronisation, ignoring the local resources.
   */
  public forceFullSync() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_COMMON.OFFLINE.FORCE_FULL_SYNC'),
        subHeader: this.t._('COMMON.ARE_YOU_SURE'),
        message: this.t._('IDEA_COMMON.OFFLINE.FULL_SYNC_DISCLAIMER'),
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
