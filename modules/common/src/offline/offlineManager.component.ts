import { Component, inject } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';

import { IDEAOfflineDataService, APIRequest } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAActionSheetController } from '../actionSheet/actionSheetController.service';

@Component({
  selector: 'idea-offline-manager',
  templateUrl: 'offlineManager.component.html',
  styleUrls: ['offlineManager.component.scss']
})
export class IDEAOfflineManagerComponent {
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _actions = inject(IDEAActionSheetController);
  private _translate = inject(IDEATranslationsService);
  _offline = inject(IDEAOfflineDataService);

  async sync(): Promise<void> {
    const alert = await this._alert.create({
      header: this._translate._('IDEA_COMMON.OFFLINE.SYNC_NOW'),
      message: this._translate._('IDEA_COMMON.OFFLINE.DONT_EXIT_APP_DISCLAIMER'),
      buttons: [
        { text: this._translate._('COMMON.CANCEL') },
        { text: this._translate._('COMMON.GOT_IT'), handler: (): Promise<void> => this._offline.synchronize(true) }
      ]
    });
    alert.present();
  }

  async deleteRequest(request: APIRequest): Promise<void> {
    const alert = await this._alert.create({
      header: this._translate._('COMMON.ARE_YOU_SURE'),
      message: this._translate._('IDEA_COMMON.OFFLINE.DELETION_IS_IRREVERSIBLE'),
      buttons: [
        { text: this._translate._('COMMON.CANCEL') },
        {
          text: this._translate._('COMMON.CONFIRM'),
          handler: (): Promise<void> => this._offline.deleteRequest(request)
        }
      ]
    });
    alert.present();
  }
  downloadRequestLog(request: APIRequest): void {
    const dataURL = window.URL.createObjectURL(new Blob([JSON.stringify(request)], { type: 'text/json' }));
    Browser.open({ url: dataURL });
  }

  async actions(): Promise<void> {
    const buttons = [
      {
        text: this._translate._('IDEA_COMMON.OFFLINE.FORCE_FULL_SYNC'),
        icon: 'sync',
        handler: (): Promise<void> => this.forceFullSync()
      },
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' }
    ];
    const actions = await this._actions.create({
      header: this._translate._('IDEA_COMMON.OFFLINE.ADVANCED_ACTIONS'),
      buttons
    });
    actions.present();
  }

  async forceFullSync(): Promise<void> {
    const alert = await this._alert.create({
      header: this._translate._('IDEA_COMMON.OFFLINE.FORCE_FULL_SYNC'),
      subHeader: this._translate._('COMMON.ARE_YOU_SURE'),
      message: this._translate._('IDEA_COMMON.OFFLINE.FULL_SYNC_DISCLAIMER'),
      buttons: [
        { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
        { text: this._translate._('COMMON.CONFIRM'), handler: (): void => this._offline.forceFullSync() }
      ]
    });
    alert.present();
  }

  close(): void {
    this._modal.dismiss();
  }
}
