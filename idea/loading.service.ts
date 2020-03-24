import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

import { IDEATranslationsService } from './translations/translations.service';

@Injectable()
export class IDEALoadingService {
  protected loadingElement: HTMLIonLoadingElement;

  constructor(public loadingCtrl: LoadingController, public t: IDEATranslationsService) {}

  /**
   * Show a loading animation.
   * @param content loading message
   */
  public async show(content?: string): Promise<void> {
    await this.hide();
    this.loadingElement = await this.loadingCtrl.create({
      message: content || this.t._('IDEA.LOADING.PLEASE_WAIT')
    });
    return await this.loadingElement.present();
  }
  /**
   * Change the content of the loading animation, while it's already on.
   * @param content new loading message
   */
  public setContent(content: string) {
    if (this.loadingElement) this.loadingElement.textContent = content;
  }
  /**
   * Hide a previous loading animation.
   * Retries three times if doesn't find a loader to hide (it may not be ready yet).
   * @param retry how many times should retry before giving up
   */
  public async hide(retry?: number): Promise<boolean> {
    if (!this.loadingElement) {
      retry = retry !== undefined ? retry : 3;
      if (retry > 0) setTimeout(() => this.hide(retry - 1), 1000);
      return null;
    }
    return await this.loadingElement.dismiss();
  }
}
