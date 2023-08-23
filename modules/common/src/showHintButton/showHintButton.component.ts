import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-show-hint-button',
  templateUrl: 'showHintButton.component.html',
  styleUrls: ['showHintButton.component.scss']
})
export class IDEAShowHintButtonComponent {
  /**
   * The string to show as title of the alert.
   */
  @Input() hint: string;
  /**
   * The string to show as content of the alert.
   * If not specified, it's equal to `hint.concat('_I')`.
   */
  @Input() message?: string;
  /**
   * The string to show as the alert's confirmation button.
   */
  @Input() confirmationText = 'OK';
  /**
   * Whether the input strings need to be translated or they are already.
   */
  _shouldTranslate: boolean;
  get translate(): boolean | string {
    return this._shouldTranslate;
  }
  @Input() set translate(input: boolean | string) {
    this._shouldTranslate = String(input) !== 'false';
  }
  /**
   * A CSS class to apply to the alert box.
   */
  @Input() cssClass? = 'alertLongOptions';
  /**
   * The slots where to put the button.
   */
  @Input() slot = 'start';
  /**
   * The fill attribute of the button.
   */
  @Input() fill = 'clear';
  /**
   * The color of the button.
   */
  @Input() color?: string;
  /**
   * The IonIcon to show for the button.
   */
  @Input() icon = 'help-circle-outline';

  constructor(private alertCtrl: AlertController, private t: IDEATranslationsService) {}

  async showHint(event?: any): Promise<void> {
    if (event) event.stopPropagation();

    if (!this.hint) return;

    const header = this._shouldTranslate ? this.t._(this.hint) : this.hint;
    const message = this._shouldTranslate ? this.t._(this.message ?? this.hint.concat('_I')) : this.message;
    const buttonText =
      this._shouldTranslate && this.confirmationText !== 'OK' ? this.t._(this.confirmationText) : this.confirmationText;
    const buttons = [{ text: buttonText }];
    const cssClass = this.cssClass;

    const alert = await this.alertCtrl.create({ header, message, buttons, cssClass });
    alert.present();
  }
}
