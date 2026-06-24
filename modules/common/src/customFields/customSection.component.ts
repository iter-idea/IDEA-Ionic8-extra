import { Component, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonCheckbox
} from '@ionic/angular/standalone';
import { CustomFieldTypes, CustomSectionMeta } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEASelectComponent } from '../select/select.component';

@Component({
  selector: 'idea-custom-section',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IDEASelectComponent,
    IonIcon,
    IonButton,
    IonText,
    IonLabel,
    IonItem,
    IonInput,
    IonTextarea,
    IonCheckbox
  ],
  templateUrl: 'customSection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['customSection.component.scss']
})
export class IDEACustomSectionComponent {
  private _alert = inject(AlertController);
  _translate = inject(IDEATranslationsService);

  /**
   * The custom fields to manage.
   */
  readonly fields = input<any>();
  /**
   * The CustomSectionMeta that describe the custom fields.
   */
  readonly sectionMeta = input<CustomSectionMeta>();
  /**
   * Whether the component is enabled or not.
   */
  readonly disabled = input(false);
  /**
   * Lines preferences for the component.
   */
  readonly lines = input<string>();
  /**
   * Whether to hide the descriptions (buttons).
   */
  readonly hideDescriptions = input(false);
  /**
   * Show errors as reported from the parent component.
   */
  readonly errors = input(new Set());
  /**
   * Add a custom prefix to the error string identifier.
   */
  readonly errorPrefix = input('');

  CFT = CustomFieldTypes;

  hasFieldAnError(field: string): boolean {
    return this.errors().has(field);
  }

  async openDescription(fieldKey: string, event: any): Promise<void> {
    if (event) event.stopPropagation();
    const message = this._translate._label(this.sectionMeta().fields[fieldKey].description);
    if (!message) return;

    const header = this._translate._label(this.sectionMeta().fields[fieldKey].name);
    const alert = await this._alert.create({ header, message, buttons: ['OK'], cssClass: 'alertLongOptions' });
    await alert.present();
  }
}
