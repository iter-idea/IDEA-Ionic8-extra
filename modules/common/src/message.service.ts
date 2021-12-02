import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

import { IDEATranslationsService } from './translations/translations.service';

@Injectable({ providedIn: 'root' })
export class IDEAMessageService {
  constructor(private toastCtrl: ToastController, private t: IDEATranslationsService) {}

  /**
   * Show a generic message toast.
   * @param message message to show
   * @param color Ionic colors defined in the theme
   */
  private async show(message: string, color: string, dontTranslate: boolean): Promise<void> {
    message = dontTranslate ? message : this.t._(message);

    const duration = 3000;
    const position = 'bottom';
    const buttons = [{ text: 'X', role: 'cancel' }];

    const toast = await this.toastCtrl.create({ message, duration, position, color, buttons });
    return await toast.present();
  }

  /**
   * Show an info message toast.
   * @param message message to show
   */
  async info(message: string, dontTranslate?: boolean): Promise<void> {
    return await this.show(message, 'dark', dontTranslate);
  }
  /**
   * Show a success message toast.
   * @param message message to show
   */
  async success(message: string, dontTranslate?: boolean): Promise<void> {
    return await this.show(message, 'success', dontTranslate);
  }
  /**
   * Show an error message toast.
   * @param message message to show
   */
  async error(message: string, dontTranslate?: boolean): Promise<void> {
    return await this.show(message, 'danger', dontTranslate);
  }
  /**
   * Show an warning message toast.
   * @param message message to show
   */
  async warning(message: string, dontTranslate?: boolean): Promise<void> {
    return await this.show(message, 'warning', dontTranslate);
  }
}
