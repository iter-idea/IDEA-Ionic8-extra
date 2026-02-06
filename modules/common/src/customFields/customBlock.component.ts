import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonList,
  IonListHeader,
  IonLabel,
  IonItem,
  IonButton,
  IonIcon,
  IonText,
  IonTextarea,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';
import { CustomBlockMeta, CustomFieldTypes } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEASelectComponent } from '../select/select.component';

@Component({
  selector: 'idea-custom-block',
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IDEASelectComponent,
    IonText,
    IonIcon,
    IonButton,
    IonItem,
    IonLabel,
    IonListHeader,
    IonList,
    IonInput,
    IonTextarea,
    IonCheckbox
  ],
  templateUrl: 'customBlock.component.html',
  styleUrls: ['customBlock.component.scss']
})
export class IDEACustomBlockComponent {
  private _alert = inject(AlertController);
  _translate = inject(IDEATranslationsService);

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

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  hasDescription(sectionKey: string, fieldKey: string): boolean {
    return !!this._translate._label(this.blockMeta.sections[sectionKey].fields[fieldKey].description);
  }
  async openDescription(sectionKey: string, fieldKey: string, event: any): Promise<void> {
    if (event) event.stopPropagation();
    const message = this._translate._label(this.blockMeta.sections[sectionKey].fields[fieldKey].description);
    if (!message) return;

    const header = this._translate._label(this.blockMeta.sections[sectionKey].fields[fieldKey].name);
    const alert = await this._alert.create({ header, message, buttons: ['OK'], cssClass: 'alertLongOptions' });
    await alert.present();
  }
}
