import { Component } from '@angular/core';
import { ModalController, AlertController, ActionSheetController } from '@ionic/angular';
import Moment = require('moment-timezone');

import { IDEAOfflineDataService, APIRequest } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-offline-manager',
  templateUrl: 'offlineManager.component.html',
  styleUrls: ['offlineManager.component.scss']
})
export class IDEAOfflineManagerComponent {
  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public offline: IDEAOfflineDataService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    Moment.locale(this.t.getCurrentLang());
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
   * Advanced actions.
   */
  public actions() {
    const buttons = [
      { text: this.t._('IDEA.OFFLINE.FORCE_FULL_SYNC'), handler: () => this.forceFullSync() },
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' }
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
