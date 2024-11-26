import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  AlertController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonLabel,
  IonText,
  IonBadge,
  IonItem,
  IonInput,
  IonReorderGroup,
  IonReorder,
  IonCol,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/angular/standalone';
import { CustomFieldMeta, CustomFieldTypes, Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEAMessageService } from '../message.service';
import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAIconsComponent } from '../icons/icons.component';
import { IDEASelectComponent } from '../select/select.component';

@Component({
  selector: 'idea-custom-field-meta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IDEALabelerComponent,
    IDEAIconsComponent,
    IDEASelectComponent,
    IonRow,
    IonCol,
    IonReorder,
    IonReorderGroup,
    IonInput,
    IonItem,
    IonBadge,
    IonText,
    IonLabel,
    IonListHeader,
    IonHeader,
    IonList,
    IonContent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    IonToggle
  ],
  templateUrl: 'customFieldMeta.component.html',
  styleUrls: ['customFieldMeta.component.scss']
})
export class IDEACustomFieldMetaComponent implements OnInit {
  private _alert = inject(AlertController);
  private _modal = inject(ModalController);
  private _message = inject(IDEAMessageService);
  _translate = inject(IDEATranslationsService);

  /**
   * The CustomFieldMeta to manage.
   */
  @Input() field: CustomFieldMeta;
  /**
   * Whether the component is enabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines: string;

  _field: CustomFieldMeta;
  errors = new Set<string>();
  FIELD_TYPES: string[] = Object.keys(CustomFieldTypes);
  CFT = CustomFieldTypes;

  ngOnInit(): void {
    this._field = new CustomFieldMeta(this.field, this._translate.languages());
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async editLabel(title: string, label: Label): Promise<void> {
    const componentProps = { title, label, obligatory: true };
    const modal = await this._modal.create({ component: IDEALabelerComponent, componentProps });
    await modal.present();
  }

  async editIcon(): Promise<void> {
    const modal = await this._modal.create({ component: IDEAIconsComponent });
    modal.onDidDismiss().then(({ data }): void => {
      if (data) this._field.icon = data;
    });
    await modal.present();
  }

  reorderOptions(ev: any): void {
    this._field.enum = ev.detail.complete(this._field.enum);
  }
  async removeOptionByIndex(index: number): Promise<void> {
    const doRemoveByIndex = (): void => {
      const e = this._field.enum[index];
      if (this._field.enumLabels) delete this._field.enumLabels[e];
      this._field.enum.splice(index, 1);
    };
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doRemoveByIndex }
    ];
    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const alert = await this._alert.create({ header, buttons });
    await alert.present();
  }
  async addOption(): Promise<void> {
    const doAddOption = (data: any): void => {
      if (!data.enum) return;
      // initialize the label
      const label = new Label(null, this._translate.languages());
      // set the translation in the default (obligatory) language
      label[this._translate.getDefaultLang()] = data.enum;
      // ensure backwards compatibility
      if (!this._field.enumLabels) this._field.enumLabels = {};
      this._field.enumLabels[data.enum] = label;
      if (!this._field.enum) this._field.enum = new Array<string>();
      // add the enum and configure the enumLabel
      this._field.enum.push(data.enum);
      this.editEnumLabel(data.enum);
    };

    const header = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_OPTION');
    const message = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_OPTION_HINT');
    const inputs: any = [{ name: 'enum', type: 'text' }];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doAddOption }
    ];

    const alert = await this._alert.create({ header, message, inputs, buttons });
    await alert.present();

    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  editEnumLabel(theEnum: string): void {
    // ensere backwards compatibility
    if (!this._field.enumLabels) this._field.enumLabels = {};
    if (!this._field.enumLabels[theEnum])
      this._field.enumLabels[theEnum] = new Label(null, this._translate.languages());
    // set the translation in the default (obligatory) language
    const label = this._field.enumLabels[theEnum];
    if (!label[this._translate.getDefaultLang()]) label[this._translate.getDefaultLang()] = theEnum;

    this.editLabel(theEnum, label);
  }

  save(): Promise<void> {
    this.errors = new Set(this._field.validate(this._translate.languages()));
    if (this.errors.size) return this._message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    this.field.load(this._field, this._translate.languages());
    this.close(true);
  }

  close(somethingChanged?: boolean): void {
    this._modal.dismiss(somethingChanged);
  }
}
