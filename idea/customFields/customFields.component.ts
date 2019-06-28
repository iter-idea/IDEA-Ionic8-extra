import { Component, Input, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

@Component({
  selector: 'idea-custom-fields',
  templateUrl: 'customFields.component.html',
  styleUrls: ['customFields.component.scss'],
})
/**
 * Note: if the defaultLanguage is used, then the fields are managed with transalations.
 */
export class IDEACustomFieldsComponent {
  /**
   * Ordered list of the fields (names) to expect.
   *
   * e.g. [ 'tShirtSize', 'favColor', ... ]
   */
  @Input() public fieldsLegend: Array<string>;
  /**
   * Object containing attributes of type CustomField.
   *
   * e.g.
   *
   *    fields.tShirtSize: CustomField;
   *    fields.favColor: CustomField;
   *    ...
   */
  @Input() protected fields: any;
  /**
   * If true, the customFieldManager won't open when the field is clicked.
   */
  @Input() protected disabled: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() protected lines: string;
  /**
   * If true, the reorder possibility won't be available.
   */
  @Input() protected withoutReorder: boolean;
  /**
   * Whether to show the button to remove a field or not.
   */
  @Input() protected showRemoveBtn: boolean;
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
   * Emit selection of a custom field.
   */
  @Output() protected select = new EventEmitter<IdeaX.CustomField | IdeaX.CustomFieldT>();
  /**
   * Emit removal of a custom field.
   */
  @Output() protected remove = new EventEmitter<IdeaX.CustomField | IdeaX.CustomFieldT>();

  constructor(protected t: TranslateService) {
    this.disabled = false;        // needed
    this.withoutReorder = false;  //
  }

  /**
   * Reorder the fields legend.
   */
  protected reorderFieldsLegend(ev: any) {
    this.fieldsLegend.splice(ev.detail.to, 0, this.fieldsLegend.splice(ev.detail.from, 1)[0]);
    // Once the data structure has been updated to reflect the reorder change, the complete() method must be called.
    ev.detail.complete();
  }

  /**
   * Return the name of the field; if the field support translations, the function manages them.
   */
  protected getFieldName(field: IdeaX.CustomField | IdeaX.CustomFieldT): string {
    if (this.defaultLanguage) return field.name[this.currentLanguage] || field.name[this.defaultLanguage];
    else return String(field.name);
  }
  /**
   * Return the description of the field; if the field support translations, the function manages them.
   */
  protected getFieldDescription(field: IdeaX.CustomField | IdeaX.CustomFieldT): string {
    if (this.defaultLanguage) return field.description[this.currentLanguage] || field.description[this.defaultLanguage];
    else return String(field.description);
  }
}
