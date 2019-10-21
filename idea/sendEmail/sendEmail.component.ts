import { Component, Input, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

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

  /// TEMPORARY
  public to: string;
  public cc: string;

  constructor(public modalCtrl: ModalController, public t: TranslateService) {}
  public ngOnInit() {
    this.to = this.email.to.join(',');
    this.cc = this.email.cc.join(',');
  }

  /**
   * Check if the obligatory fields are set.
   */
  public canSend(): boolean {
    // return Boolean(this.email.to.length && this.email.subject && this.email.content);
    return Boolean(this.to && this.email.subject && this.email.content);
  }

  /**
   * Confirm the email sending.
   */
  public send() {
    this.email.to = (this.to || '').split(',');
    this.email.cc = (this.cc || '').split(',');
    this.modalCtrl.dismiss(this.email);
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
