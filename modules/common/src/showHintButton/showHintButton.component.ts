import { Component, Input, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { AlertController, IonButton, IonIcon } from '@ionic/angular/standalone';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-show-hint-button',
  imports: [IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ion-button [slot]="slot()" [fill]="fill()" [color]="color()" (click)="showHint($event)">
      <ion-icon [icon]="icon()" slot="icon-only" />
    </ion-button>
  `
})
export class IDEAShowHintButtonComponent {
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The string to show as title of the alert.
   */
  readonly hint = input<string>();
  /**
   * The string to show as content of the alert.
   * If not specified, it's equal to `hint.concat('_I')`.
   */
  readonly message = input<string>();
  /**
   * The string to show as the alert's confirmation button.
   */
  readonly confirmationText = input('OK');
  /**
   * Whether the input strings need to be translated or they are already.
   */
  _shouldTranslate: boolean;
  get translate(): boolean | string {
    return this._shouldTranslate;
  }
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input() set translate(input: boolean | string) {
    this._shouldTranslate = String(input) !== 'false';
  }
  /**
   * A CSS class to apply to the alert box.
   */
  readonly cssClass = input('alertLongOptions');
  /**
   * The slots where to put the button.
   */
  readonly slot = input('start');
  /**
   * The fill attribute of the button.
   */
  readonly fill = input('clear');
  /**
   * The color of the button.
   */
  readonly color = input<string>();
  /**
   * The IonIcon to show for the button.
   */
  readonly icon = input('help-circle-outline');

  async showHint(event?: any): Promise<void> {
    if (event) event.stopPropagation();

    const hint = this.hint();
    if (!hint) return;

    const header = this._shouldTranslate ? this._translate._(hint) : hint;
    const message = this._shouldTranslate ? this._translate._(this.message() || hint.concat('_I')) : this.message();
    const confirmationText = this.confirmationText();
    const buttonText =
      this._shouldTranslate && confirmationText !== 'OK' ? this._translate._(confirmationText) : confirmationText;
    const buttons = [{ text: buttonText }];
    const cssClass = this.cssClass();

    const alert = await this._alert.create({ header, message, buttons, cssClass });
    alert.present();
  }
}
