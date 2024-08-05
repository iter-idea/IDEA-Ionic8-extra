import { Component, Input, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CustomFieldTypes, CustomSectionMeta } from 'idea-toolbox';

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
  @Input() fields: any;
  /**
   * The CustomSectionMeta that describe the custom fields.
   */
  @Input() sectionMeta: CustomSectionMeta;
  /**
   * Whether the component is enabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines: string;
  /**
   * Whether to hide the descriptions (buttons).
   */
  @Input() hideDescriptions = false;
  /**
   * Show errors as reported from the parent component.
   */
  @Input() errors = new Set();
  /**
   * Add a custom prefix to the error string identifier.
   */
  @Input() errorPrefix = '';

  CFT = CustomFieldTypes;

  private _alert = inject(AlertController);
  _translate = inject(IDEATranslationsService);

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async openDescription(fieldKey: string, event: any): Promise<void> {
    if (event) event.stopPropagation();
    const message = this._translate._label(this.sectionMeta.fields[fieldKey].description);
    if (!message) return;

    const header = this._translate._label(this.sectionMeta.fields[fieldKey].name);
    const alert = await this._alert.create({ header, message, buttons: ['OK'], cssClass: 'alertLongOptions' });
    await alert.present();
  }
}
