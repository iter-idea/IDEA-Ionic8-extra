import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

@Component({
  selector: 'idea-custom-field-manager',
  templateUrl: 'customFieldManager.component.html',
  styleUrls: ['customFieldManager.component.scss'],
})
/**
 * Note: if the defaultLanguage is used, then the field is managed with transalations.
 */
export class IDEACustomFieldManagerComponent {
  /**
   * The CustomField to manage (the component will work on a copy and return the updated object).
   */
  @Input() protected field: IdeaX.CustomField | IdeaX.CustomFieldT;
  /**
   * Default (fallback) language for Label fields.
   */
  @Input() protected defaultLanguage: string;
  /**
   * Current language to display for Label fields.
   */
  @Input() protected currentLanguage: string;
  /**
   * Available languages for Label fields.
   */
  @Input() protected availableLanguages: Array<string>;

  /**
   * The working copy of the field; if returned, it means that the original field has been modified.
   */
  protected theField: IdeaX.CustomField | IdeaX.CustomFieldT;

  protected errors: Array<string>;
  protected FIELD_TYPES: Array<string> = Object.keys(IdeaX.CustomFieldTypes);
  protected enumAsString: string;

  constructor(
    protected modalCtrl: ModalController,
    protected alertCtrl: AlertController,
    protected t: TranslateService
  ) {
    this.errors = Array<string>();
  }
  protected ngOnInit() {
    if (this.defaultLanguage) {
      this.theField = new IdeaX.CustomFieldT(this.availableLanguages);
      this.theField.load(this.field, this.availableLanguages);
    } else {
      this.theField = new IdeaX.CustomField();
      this.theField.load(this.field);
    }
    if (!this.theField) this.close();
    this.enumAsString = (this.theField.enum || []).join(', ');
  }

  /**
   * Set the nam of the field; if the field support translations, the function manages them.
   */
  protected setFieldName(name: string) {
    if (this.defaultLanguage) this.theField.name[this.currentLanguage] = name;
    else this.theField.name = name;
  }
  /**
   * Set the description of the field; if the field support translations, the function manages them.
   */
  protected setFieldDescription(description: string) {
    if (this.defaultLanguage) this.theField.description[this.currentLanguage] = description;
    else this.theField.description = description;
  }

  /**
   * Return the name of the field; if the field support translations, the function manages them.
   */
  protected getFieldName(): string {
    if (this.defaultLanguage)
      return this.theField.name[this.currentLanguage] || this.theField.name[this.defaultLanguage];
    else return String(this.theField.name);
  }
  /**
   * Return the description of the field; if the field support translations, the function manages them.
   */
  protected getFieldDescription(): string {
    if (this.defaultLanguage)
      return this.theField.description[this.currentLanguage] || this.theField.description[this.defaultLanguage];
    else return String(this.theField.description);
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
    if (this.theField.type === IdeaX.CustomFieldTypes.ENUM) {
      this.theField.enum = Array.from(new Set(this.enumAsString.split(',').map(x => x.trim()).filter(x => x)));
      if (!this.theField.enum.length) this.field.enum = null;
    } else this.theField.enum = null;
    // reset obligatory if field is boolean
    if (this.theField.type === IdeaX.CustomFieldTypes.BOOLEAN) {
      this.theField.obligatory = false;
      this.theField.default = null;
    }
    // reset min/max if field isn't number
    if (this.theField.type !== IdeaX.CustomFieldTypes.NUMBER) {
      this.theField.min = null;
      this.theField.max = null;
    }
    // checkings
    this.errors = this.theField instanceof IdeaX.CustomFieldT ?
      this.theField.validate(this.defaultLanguage) : this.theField.validate();
    if (this.errors.length) return;
    // return the cleaned field
    this.close(this.theField);
  }

  /**
   * Close the modal, optionally returning the updated field.
   */
  protected close(updatedField?: IdeaX.CustomField | IdeaX.CustomFieldT) {
    this.modalCtrl.dismiss(updatedField);
  }
}
