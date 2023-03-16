import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Contacts } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-contacts',
  templateUrl: 'contacts.component.html',
  styleUrls: ['contacts.component.scss']
})
export class IDEAContactsComponent {
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

  constructor(private alertCtrl: AlertController, private t: IDEATranslationsService) {}

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
    const header = this.t._('COMMON.DO_YOU_WANT_TO_PROCEED');
    const buttons = [{ text: this.t._('COMMON.CANCEL') }, { text: this.t._('COMMON.CONFIRM'), handler: () => cb() }];
    const cssClass = 'selectableAlertMessage';
    this.alertCtrl.create({ header, message, buttons, cssClass }).then(alert => alert.present());
  }
}
