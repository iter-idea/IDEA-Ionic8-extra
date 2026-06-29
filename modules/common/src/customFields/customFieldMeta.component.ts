import { Component, OnInit, inject, ChangeDetectionStrategy, Input, signal } from '@angular/core';
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

@Component({
  selector: 'idea-custom-field-meta',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @Input() field?: CustomFieldMeta;
  /**
   * Whether the component is enabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines?: string;

  // the held instance is mutated in place (so [(ngModel)] keeps a stable reference); `equal: () => false`
  // forces every update()/set() to notify, which is what schedules CD in both Zone and zoneless modes
  _field = signal<CustomFieldMeta>(undefined, { equal: () => false });
  errors = new Set<string>();
  FIELD_TYPES: string[] = Object.keys(CustomFieldTypes);
  CFT = CustomFieldTypes;

  ngOnInit(): void {
    this._field.set(new CustomFieldMeta(this.field, this._translate.languages()));
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
      this._field.update(f => {
        if (data) f.icon = data;
        return f;
      });
    });
    await modal.present();
  }

  reorderOptions(ev: any): void {
    this._field.update(f => {
      f.enum = ev.detail.complete(f.enum);
      return f;
    });
  }
  async removeOptionByIndex(index: number): Promise<void> {
    const doRemoveByIndex = (): void => {
      this._field.update(f => {
        const e = f.enum[index];
        if (f.enumLabels) delete f.enumLabels[e];
        f.enum.splice(index, 1);
        return f;
      });
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
      this._field.update(f => {
        // ensure backwards compatibility
        if (!f.enumLabels) f.enumLabels = {};
        f.enumLabels[data.enum] = label;
        if (!f.enum) f.enum = new Array<string>();
        // add the enum and configure the enumLabel
        f.enum.push(data.enum);
        return f;
      });
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
    const field = this._field();
    // ensere backwards compatibility
    if (!field.enumLabels) field.enumLabels = {};
    if (!field.enumLabels[theEnum]) field.enumLabels[theEnum] = new Label(null, this._translate.languages());
    // set the translation in the default (obligatory) language
    const label = field.enumLabels[theEnum];
    if (!label[this._translate.getDefaultLang()]) label[this._translate.getDefaultLang()] = theEnum;

    this.editLabel(theEnum, label);
  }

  save(): Promise<void> {
    this.errors = new Set(this._field().validate(this._translate.languages()));
    if (this.errors.size) return this._message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    this.field.load(this._field(), this._translate.languages());
    this.close(true);
  }

  close(somethingChanged?: boolean): void {
    this._modal.dismiss(somethingChanged);
  }
}
