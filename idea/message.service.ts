import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable()
export class IDEAMessageService {
  constructor(private toastCtrl: ToastController) {}

  /**
   * Show a generic message toast.
   * @param message message to show
   * @param color Ionic colors defined in the theme
   */
  public show(message: string, color?: string) {
    this.toastCtrl.create({
      message: message, duration: 3000, position: 'bottom', color: color,
      showCloseButton: true, closeButtonText: 'X'
    })
    .then(toast => toast.present());
  }
  /**
   * Show a success message toast.
   * @param message message to show
   */
  public success(message: string) {
    this.show(message, 'success');
  }
  /**
   * Show an error message toast.
   * @param message message to show
   */
  public error(message: string) {
    this.show(message, 'danger');
  }
  /**
   * Show an warning message toast.
   * @param message message to show
   */
  public warning(message: string) {
    this.show(message, 'warning');
  }
}
