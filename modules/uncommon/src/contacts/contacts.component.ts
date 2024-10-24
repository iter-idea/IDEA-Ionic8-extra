import { Component, Input, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Contacts } from 'idea-toolbox';
import { IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-contacts',
  templateUrl: 'contacts.component.html',
  styleUrls: ['contacts.component.scss']
})
export class IDEAContactsComponent {
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The contacts to manage.
   */
  @Input() contacts: Contacts = new Contacts();
  /**
   * If true, show the field `name`.
   */
  @Input() showName = false;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() editMode = true;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;

  sendEmail(): void {
    if (!this.contacts.email) return;
    const url = `mailto:${this.contacts.email}`;
    this.preExternalAction(this.contacts.email, (): Window => window.open(url, '_system'));
  }
  call(): void {
    if (!this.contacts.phone) return;
    const url = `tel:${this.contacts.phone}`;
    this.preExternalAction(this.contacts.phone, (): Window => window.open(url, '_system'));
  }

  private preExternalAction(message: string, cb: () => void): void {
    const header = this._translate._('COMMON.DO_YOU_WANT_TO_PROCEED');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL') },
      { text: this._translate._('COMMON.CONFIRM'), handler: (): void => cb() }
    ];
    const cssClass = 'selectableAlertMessage';
    this._alert.create({ header, message, buttons, cssClass }).then(alert => alert.present());
  }
}
