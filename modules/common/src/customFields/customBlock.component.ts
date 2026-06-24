import { Component, Input, inject, ChangeDetectionStrategy, input } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['customBlock.component.scss']
})
export class IDEACustomBlockComponent {
  private _alert = inject(AlertController);
  _translate = inject(IDEATranslationsService);

  /**
   * The custom sections to manage.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() sections: any;
  /**
   * The CustomBlockMeta that describe the custom sections.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() blockMeta: CustomBlockMeta;
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
