import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { CustomField, CustomFieldTypes } from '../../../../../api/_models/customField.model';

@Component({
  selector: 'idea-custom-field-manager',
  templateUrl: 'customFieldManager.component.html',
  styleUrls: ['customFieldManager.component.scss'],
})
export class IDEACustomFieldManagerComponent {
  @Input() protected field: any;

  protected theField: CustomField;

  protected errors: Array<string>;
  protected FIELD_TYPES: Array<string> = Object.keys(CustomFieldTypes);
  protected enumAsString: string;

  constructor(
    protected modalCtrl: ModalController,
    protected alertCtrl: AlertController,
    protected t: TranslateService
  ) {
    this.errors = Array<string>();
  }
  protected ngOnInit() {
    this.theField = new CustomField();
    this.theField.load(this.field);
    if (!this.theField) this.close();
    this.enumAsString = (this.theField.enum || []).join(', ');
  }

  /**
   * Set the support array to display errors in the UI.
   */
  protected hasFieldAnError(field: string): boolean {
    return this.errors.some(e => e === field);
  }

  /**
   * Return the modified field and close.
   */
  protected save() {
    // convert and clean the string enum (reset the enum if the type isn't correct)
    if (this.theField.type === CustomFieldTypes.ENUM) {
      this.theField.enum = Array.from(new Set(this.enumAsString.split(',').map(x => x.trim()).filter(x => x)));
      if (!this.theField.enum.length) this.field.enum = null;
    } else this.theField.enum = null;
    // reset obligatory if field is boolean
    if (this.theField.type === CustomFieldTypes.BOOLEAN) {
      this.theField.obligatory = false;
      this.theField.default = null;
    }
    // reset min/max if field isn't number
    if (this.theField.type !== CustomFieldTypes.NUMBER) {
      this.theField.min = null;
      this.theField.max = null;
    }
    // checkings
    this.errors = this.theField.validate();
    if (this.errors.length) return;
    // return the cleaned field
    this.close(this.theField);
  }

  /**
   * Close reporting the field deletion.
   */
  protected delete() {
    this.alertCtrl.create({
      header: this.t.instant('COMMON.ARE_YOU_SURE'),
      message: this.t.instant('IDEA.CUSTOM_FIELDS.FIELD_DELETION_ALERT'),
      buttons: [
        { text: this.t.instant('COMMON.CANCEL') },
        { text: this.t.instant('COMMON.CONFIRM'), handler: () => this.close(false) }
      ]
    })
    .then(alert => alert.present());
  }

  /**
   * Close the modal, optionally returning data.
   */
  protected close(data?: any) {
    this.modalCtrl.dismiss(data);
  }
}
