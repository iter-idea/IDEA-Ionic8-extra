import { Component, Input, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { CustomField } from '../../../../../api/_models/customField.model';

@Component({
  selector: 'idea-custom-fields',
  templateUrl: 'customFields.component.html',
  styleUrls: ['customFields.component.scss'],
})
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
   * If true, the reorder possibility won't be available.
   */
  @Input() protected withoutReorder: boolean;
  /**
   * Whether to show the button to remove a field or not.
   */
  @Input() protected showRemoveBtn: boolean;
  /**
   * Emit selection of a custom field.
   */
  @Output() protected select = new EventEmitter<CustomField>();
  /**
   * Emit removal of a custom field.
   */
  @Output() protected remove = new EventEmitter<CustomField>();

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
}
