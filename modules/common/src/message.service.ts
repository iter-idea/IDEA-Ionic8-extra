import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

import { IDEATranslationsService } from './translations/translations.service';

@Injectable({ providedIn: 'root' })
export class IDEAMessageService {
  private _toast = inject(ToastController);
  private _translate = inject(IDEATranslationsService);

  /**
   * Show a generic message toast.
   * @param message message to show (i18n key to translate, if `dontTranslate === false`)
   * @param color among Ionic colors defined in the theme
   * @param dontTranslate whether the message is already a translated text
   * @param serverMessage some untranslatable text from the back-end, to add as detail after the message
   */
  private async show(
    message: string,
    options: { color: string; dontTranslate?: boolean; serverMessage?: string }
  ): Promise<void> {
    message = message || '';
    const { color, dontTranslate, serverMessage } = options;

    if (!dontTranslate) message = this._translate._(message);

    const duration = serverMessage ? 5000 : 3000;
    const position = 'bottom';
    const buttons = [{ text: 'X', role: 'cancel' }];
    const header = serverMessage ? message : undefined;
    const cssClass = serverMessage ? 'toastWithServerMessage' : '';

    const toast = await this._toast.create({
      message: serverMessage || message,
      header,
      duration,
      position,
      color,
      buttons,
      cssClass
    });
    return await toast.present();
  }

  /**
   * Show an info message toast.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async info(message: string, options?: { dontTranslate?: boolean; serverMessage?: string }): Promise<void> {
    const { dontTranslate, serverMessage } = options || {};
    return await this.show(message, { color: 'dark', dontTranslate, serverMessage });
  }
  /**
   * Show a success message toast.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async success(message: string, options?: { dontTranslate?: boolean; serverMessage?: string }): Promise<void> {
    const { dontTranslate, serverMessage } = options || {};
    return await this.show(message, { color: 'success', dontTranslate, serverMessage });
  }
  /**
   * Show an error message toast.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async error(message: string, options?: { dontTranslate?: boolean; serverMessage?: string }): Promise<void> {
    const { dontTranslate, serverMessage } = options || {};
    return await this.show(message, { color: 'danger', dontTranslate, serverMessage });
  }
  /**
   * Show a warning message toast.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async warning(message: string, options?: { dontTranslate?: boolean; serverMessage?: string }): Promise<void> {
    const { dontTranslate, serverMessage } = options || {};
    return await this.show(message, { color: 'warning', dontTranslate, serverMessage });
  }
}
