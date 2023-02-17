import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { CustomBlockMeta, CustomFieldTypes } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-custom-block',
  templateUrl: 'customBlock.component.html',
  styleUrls: ['customBlock.component.scss']
})
export class IDEACustomBlockComponent {
  /**
   * The custom sections to manage.
   */
  @Input() sections: any;
  /**
   * The CustomBlockMeta that describe the custom sections.
   */
  @Input() blockMeta: CustomBlockMeta;
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

  constructor(private alertCtrl: AlertController, public t: IDEATranslationsService) {}

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async openDescription(sectionKey: string, fieldKey: string, event: any): Promise<void> {
    if (event) event.stopPropagation();
    const message = this.t._label(this.blockMeta.sections[sectionKey].fields[fieldKey].description);
    if (!message) return;

    const header = this.t._label(this.blockMeta.sections[sectionKey].fields[fieldKey].name);
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'], cssClass: 'alertLongOptions' });
    await alert.present();
  }
}
