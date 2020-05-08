import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

@Component({
  selector: 'idea-send-email',
  templateUrl: 'sendEmail.component.html',
  styleUrls: ['sendEmail.component.scss']
})
export class IDEASendEmailComponent {
  /**
   * The content and receivers of the email.
   */
  @Input() public email: IdeaX.EmailData;
  /**
   * Visual indicators of the attachments that will be sent.
   */
  @Input() public attachments: Array<string>;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() public variables: Array<IdeaX.EmailDataVariable>;
  /**
   * A map of the values to substitute to the variables.
   */
  @Input() public values: { [variable: string]: string | number };
  /**
   * The suggested contacts for the email composer.
   */
  @Input() public contacts: Array<IdeaX.Suggestion>;
  /**
   * Lines preferences for the items.
   */
  @Input() public lines: string;
  /**
   * A copy of the email data, to use until the changes are confirmed.
   */
  public _email: IdeaX.EmailData;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    // use a copy, to confirm it only when saving
    this._email = new IdeaX.EmailData(this.email);
    // substitute the variables in subject and content
    if (!this.variables) this.variables = new Array<IdeaX.EmailDataVariable>();
    if (!this.values) this.values = {};
    this.variables.forEach(v => {
      if (this.values[v.code]) {
        this._email.subject = this._email.subject.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
        this._email.content = this._email.content.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
      }
    });
  }

  /**
   * Add an email address to the list.
   */
  public addAddressToList(list: Array<string>) {
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: {
          data: this.contacts || [],
          sortData: true,
          searchPlaceholder: this.t._('IDEA.EMAIL.CHOOSE_OR_ADD_AN_ADDRESS'),
          noElementsFoundText: this.t._('IDEA.EMAIL.NO_ADDRESS_FOUND_YOU_CAN_ADD_ONE'),
          allowUnlistedValues: true,
          lines: this.lines
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(res => {
          if (res && res.data && res.data.value && !list.includes(res.data.value)) list.push(res.data.value);
        });
        modal.present();
      });
  }
  /**
   * Remove the address from the list.
   */
  public removeAddressFromList(list: Array<string>, address: string) {
    list.splice(list.indexOf(address), 1);
  }

  /**
   * Check if the obligatory fields are set.
   */
  public canSend(): boolean {
    return Boolean(this._email.to.length && this._email.subject && this._email.content);
  }
  /**
   * Confirm the email sending.
   */
  public send() {
    this.email.load(this._email);
    this.modalCtrl.dismiss(this.email);
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
