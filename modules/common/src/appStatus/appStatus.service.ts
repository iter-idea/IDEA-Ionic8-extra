import { Injectable } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AppStatus } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAApiService } from '../api.service';
import { IDEAStorageService } from '../storage.service';

import { environment as env } from '@env/environment';

const APP_STATUS_STORAGE_KEY = (env.idea.project ?? 'app').concat('_LAST_MESSAGE');

/**
 * Check whether the app has some status message or update to handle.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAppStatusService {
  appStatus: AppStatus;

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private t: IDEATranslationsService,
    private api: IDEAApiService,
    private storage: IDEAStorageService
  ) {}

  /**
   * Check the app's status and take according actions.
   */
  async check(options: { toastColor?: string; toastPosition?: string } = {}): Promise<AppStatus> {
    const appStatus = await this.getStatus();

    if (appStatus.inMaintenance || appStatus.mustUpdate) await this.navCtrl.navigateRoot(['app-status']);
    else await this.presentToast(appStatus, { color: options.toastColor, position: options.toastPosition });

    return appStatus;
  }
  private async getStatus(): Promise<AppStatus> {
    if (this.appStatus) return this.appStatus;
    this.appStatus = new AppStatus(await this.api.getResource(['status']));
    return this.appStatus;
  }
  private async presentToast(appStatus: AppStatus, options: { color?: string; position?: string } = {}): Promise<void> {
    let message = appStatus.content ?? '';
    if (!message && env.idea.app.version < appStatus.latestVersion)
      message = this.t._('IDEA_COMMON.APP_STATUS.NEW_VERSION', { newVersion: appStatus.latestVersion });

    if (!message) return;

    const messageAlreadyRead = await this.storage.get(APP_STATUS_STORAGE_KEY);
    if (messageAlreadyRead === message) return; // user already saw this message

    const dismissMessage = (): Promise<void> => this.storage.set(APP_STATUS_STORAGE_KEY, message);
    const buttons: any = [{ text: this.t._('IDEA_COMMON.APP_STATUS.GOT_IT'), role: 'cancel', handler: dismissMessage }];
    const color = options.color ?? 'dark';
    const position: any = options.position ?? 'bottom';

    const toast = await this.toastCtrl.create({ message, buttons, position, color });
    await toast.present();
  }
}
