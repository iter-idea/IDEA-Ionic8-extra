import { Injectable, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular';

import { IDEATranslationsService } from './translations/translations.service';

@Injectable({ providedIn: 'root' })
export class IDEALoadingService {
  private _loading = inject(LoadingController);
  private _translate = inject(IDEATranslationsService);

  private loadingElement: HTMLIonLoadingElement;

  /**
   * Show a loading animation.
   * @param content loading message
   */
  async show(content?: string): Promise<void> {
    const message = content || this._translate._('IDEA_COMMON.LOADING.PLEASE_WAIT');
    this.loadingElement = await this._loading.create({ message });
    return await this.loadingElement.present();
  }
  /**
   * Change the content of the loading animation, while it's already on.
   * @param content new loading message
   */
  setContent(content: string): void {
    if (this.loadingElement) this.loadingElement.textContent = content;
  }
  /**
   * Hide the loading animation.
   */
  async hide(): Promise<boolean> {
    if (this.loadingElement) return await this.loadingElement.dismiss();
    else return false;
  }
}
