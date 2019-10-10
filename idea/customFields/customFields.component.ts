import { Component, Input, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

@Component({
  selector: 'idea-custom-fields',
  templateUrl: 'customFields.component.html',
  styleUrls: ['customFields.component.scss']
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
  @Input() public fields: any;
  /**
   * If true, the customFieldManager won't open when the field is clicked.
   */
  @Input() public disabled: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, the reorder possibility won't be available.
   */
  @Input() public withoutReorder: boolean;
  /**
   * Whether to show the button to remove a field or not.
   */
  @Input() public showRemoveBtn: boolean;
  /**
   * Languages preferences (default, available) for the context.
   */
  @Input() public languages: IdeaX.Languages;
  /**
   * Current language to display for Label fields.
   */
  @Input() public currentLanguage: string;
  /**
   * Emit selection of a custom field.
   */
  @Output() public select = new EventEmitter<IdeaX.CustomFieldMeta>();
  /**
   * Emit removal of a custom field.
   */
  @Output() public remove = new EventEmitter<IdeaX.CustomFieldMeta>();

  constructor(public t: TranslateService) {
    this.disabled = false; // needed
    this.withoutReorder = false; //
  }

  /**
   * Reorder the fields legend.
   */
  public reorderFieldsLegend(ev: any) {
    this.fieldsLegend.splice(ev.detail.to, 0, this.fieldsLegend.splice(ev.detail.from, 1)[0]);
    // Once the data structure has been updated to reflect the reorder change, the complete() method must be called.
    ev.detail.complete();
  }
}
