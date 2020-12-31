import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmailData, StringVariable } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';

/**
 * Configurator of EmailData.
 */
@Component({
  selector: 'idea-email-data',
  templateUrl: 'emailData.component.html',
  styleUrls: ['emailData.component.scss']
})
export class IDEAEmailDataComponent {
  /**
   * The email data to manage.
   */
  @Input() public emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() public variables: Array<StringVariable>;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * A placeholder for the field.
   */
  @Input() public placeholder: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * On change event.
   */
  @Output() public change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();
  /**
   * The list of variables codes to use for substitutions.
   */
  public _variables: Array<string>;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    // create a plain list of variable codes
    this._variables = (this.variables || []).map(x => x.code);
  }

  /**
   * Open the modal to configure the email data.
   */
  public openEmailDataConfiguration() {
    this.modalCtrl
      .create({
        component: IDEAEmailDataConfigurationComponent,
        componentProps: {
          emailData: this.emailData,
          variables: this.variables,
          title: this.label,
          disabled: this.disabled,
          lines: this.lines
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(res => (res && res.data ? this.change.emit() : null));
        modal.present();
      });
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
