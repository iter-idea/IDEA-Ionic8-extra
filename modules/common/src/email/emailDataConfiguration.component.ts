import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmailData, mdToHtml, StringVariable } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-email-data-configuration',
  templateUrl: 'emailDataConfiguration.component.html',
  styleUrls: ['emailDataConfiguration.component.scss']
})
export class IDEAEmailDataConfigurationComponent {
  /**
   * The emailData to configure.
   */
  @Input() public emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() public variables: Array<StringVariable>;
  /**
   * The title for the component.
   */
  @Input() public title: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * A copy of data, to use until the changes are confirmed.
   */
  public _emailData: EmailData;
  /**
   * The list of variables codes to use for substitutions.
   */
  public _variables: Array<string>;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    // use a copy, to confirm it only when saving
    this._emailData = new EmailData(this.emailData);
    // create a plain list of variable codes
    this._variables = (this.variables || []).map(x => x.code);
  }

  /**
   * Shortcut to convert md to html;
   */
  public mdToHtml(content: string): string {
    return mdToHtml(content);
  }

  /**
   * Confirm changes and close.
   */
  public save() {
    this.emailData.load(this._emailData);
    this.close();
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
