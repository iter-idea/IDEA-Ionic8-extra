import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;
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
  @Input() public contacts: Contacts = new Contacts();
  /**
   * If true, show the field `name`.
   */
  @Input() public showName = false;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() public editMode = true;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines = 'inset';

  constructor(public alertCtrl: AlertController, public t: IDEATranslationsService) {}

  /**
   * Send an email to the contact, after a confirmation by the user.
   */
  public sendEmail() {
    if (!this.contacts.email) return;
    const url = `mailto:${this.contacts.email}`;
    this.preExternalAction(this.contacts.email, () => Browser.open({ url }));
  }
  /**
   * Call the contact, after a confirmation by the user.
   */
  public call() {
    if (!this.contacts.phone) return;
    const url = `tel:${this.contacts.phone}`;
    this.preExternalAction(this.contacts.phone, () => Browser.open({ url }));
  }
  /**
   * Request a confirmation before performing an external action.
   */
  private preExternalAction(message: string, cb: () => void) {
    const header = this.t._('COMMON.DO_YOU_WANT_TO_PROCEED');
    const buttons = [{ text: this.t._('COMMON.CANCEL') }, { text: this.t._('COMMON.CONFIRM'), handler: () => cb() }];
    const cssClass = 'selectableAlertMessage';
    this.alertCtrl.create({ header, message, buttons, cssClass }).then(alert => alert.present());
  }
}
