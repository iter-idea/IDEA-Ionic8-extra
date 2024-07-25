import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmailData, StringVariable, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

@Component({
  selector: 'idea-send-email',
  templateUrl: 'sendEmail.component.html',
  styleUrls: ['sendEmail.component.scss']
})
export class IDEASendEmailComponent implements OnInit {
  /**
   * The content and receivers of the email.
   */
  @Input() email: EmailData;
  /**
   * Visual indicators of the attachments that will be sent.
   */
  @Input() attachments: string[];
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
  /**
   * A map of the values to substitute to the variables.
   */
  @Input() values: { [variable: string]: string | number };
  /**
   * The suggested contacts for the email composer.
   */
  @Input() contacts: Suggestion[];
  /**
   * Lines preferences for the items.
   */
  @Input() lines: string;

  emailWC: EmailData;

  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  ngOnInit(): void {
    this.emailWC = new EmailData(this.email);
    if (!this.variables) this.variables = new Array<StringVariable>();
    if (!this.values) this.values = {};
    this.variables.forEach(v => {
      if (this.values[v.code]) {
        if (this.emailWC.subject)
          this.emailWC.subject = this.emailWC.subject.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
        if (this.emailWC.content)
          this.emailWC.content = this.emailWC.content.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
      }
    });
  }

  async addAddressToList(list: string[]): Promise<void> {
    const modal = await this._modal.create({
      component: IDEASuggestionsComponent,
      componentProps: {
        data: this.contacts || [],
        sortData: true,
        searchPlaceholder: this._translate._('IDEA_COMMON.EMAIL.CHOOSE_OR_ADD_AN_ADDRESS'),
        noElementsFoundText: this._translate._('IDEA_COMMON.EMAIL.NO_ADDRESS_FOUND_YOU_CAN_ADD_ONE'),
        allowUnlistedValues: true,
        lines: this.lines
      }
    });
    modal.onDidDismiss().then(res => {
      if (res && res.data && res.data.value && !list.includes(res.data.value)) list.push(res.data.value);
    });
    modal.present();
  }
  removeAddressFromList(list: string[], address: string): void {
    list.splice(list.indexOf(address), 1);
  }

  canSend(): boolean {
    return Boolean(this.emailWC.to.length && this.emailWC.subject && this.emailWC.content);
  }
  send(): void {
    this.email.load(this.emailWC);
    this._modal.dismiss(this.email);
  }

  close(): void {
    this._modal.dismiss();
  }
}
