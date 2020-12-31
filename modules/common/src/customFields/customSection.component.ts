import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CustomFieldTypes, CustomSectionMeta, Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-custom-section',
  templateUrl: 'customSection.component.html',
  styleUrls: ['customSection.component.scss']
})
export class IDEACustomSectionComponent {
  /**
   * The custom fields to manage.
   */
  @Input() public fields: any;
  /**
   * The CustomSectionMeta that describe the custom fields.
   */
  @Input() public sectionMeta: CustomSectionMeta;
  /**
   * Whether the component is enabled or not.
   */
  @Input() public disabled: boolean;
  /**
   * Lines preferences for the component.
   */
  @Input() public lines: string;
  /**
   * Whether to hide the descriptions (buttons).
   */
  @Input() public hideDescriptions: boolean;
  /**
   * Show errors as reported from the parent component.
   */
  @Input() public errors: Set<string>;
  /**
   * Add a custom prefix to the error string identifier.
   */
  @Input() public errorPrefix: string;
  /**
   * A shortcut to custom fields types.
   */
  public CFT = CustomFieldTypes;

  constructor(public alertCtrl: AlertController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.errorPrefix = this.errorPrefix || '';
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Get a label's value.
   */
  public getLabelValue(label: Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Open the description of the chosen field.
   */
  public openDescription(fieldKey: string, event: any) {
    if (event) event.stopPropagation();
    const description = this.getLabelValue(this.sectionMeta.fields[fieldKey].description);
    if (description) {
      this.alertCtrl
        .create({
          header: this.getLabelValue(this.sectionMeta.fields[fieldKey].name),
          message: description,
          buttons: ['OK'],
          cssClass: 'alertLongOptions'
        })
        .then(alert => alert.present());
    }
  }
}
