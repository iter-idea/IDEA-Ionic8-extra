import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { CustomFieldMeta, CustomFieldTypes, Label } from 'idea-toolbox';

import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAIconsComponent } from '../icons/icons.component';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAMessageService } from '../message.service';

@Component({
  selector: 'idea-custom-field-meta',
  templateUrl: 'customFieldMeta.component.html',
  styleUrls: ['customFieldMeta.component.scss']
})
export class IDEACustomFieldMetaComponent implements OnInit {
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

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    this._field = new CustomFieldMeta(this.field, this.t.languages());
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async editLabel(title: string, label: Label): Promise<void> {
    const componentProps = { title, label, obligatory: true };
    const modal = await this.modalCtrl.create({ component: IDEALabelerComponent, componentProps });
    await modal.present();
  }

  async editIcon(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: IDEAIconsComponent });
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
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      { text: this.t._('COMMON.CONFIRM'), handler: doRemoveByIndex }
    ];
    const header = this.t._('COMMON.ARE_YOU_SURE');
    const alert = await this.alertCtrl.create({ header, buttons });
    await alert.present();
  }
  async addOption(): Promise<void> {
    const doAddOption = (data: any): void => {
      if (!data.enum) return;
      // initialize the label
      const label = new Label(null, this.t.languages());
      // set the translation in the default (obligatory) language
      label[this.t.getDefaultLang()] = data.enum;
      // ensure backwards compatibility
      if (!this._field.enumLabels) this._field.enumLabels = {};
      this._field.enumLabels[data.enum] = label;
      if (!this._field.enum) this._field.enum = new Array<string>();
      // add the enum and configure the enumLabel
      this._field.enum.push(data.enum);
      this.editEnumLabel(data.enum);
    };

    const header = this.t._('IDEA_COMMON.CUSTOM_FIELDS.ADD_OPTION');
    const message = this.t._('IDEA_COMMON.CUSTOM_FIELDS.ADD_OPTION_HINT');
    const inputs: any = [{ name: 'enum', type: 'text' }];
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      { text: this.t._('COMMON.CONFIRM'), handler: doAddOption }
    ];

    const alert = await this.alertCtrl.create({ header, message, inputs, buttons });
    await alert.present();

    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  editEnumLabel(theEnum: string): void {
    // ensere backwards compatibility
    if (!this._field.enumLabels) this._field.enumLabels = {};
    if (!this._field.enumLabels[theEnum]) this._field.enumLabels[theEnum] = new Label(null, this.t.languages());
    // set the translation in the default (obligatory) language
    const label = this._field.enumLabels[theEnum];
    if (!label[this.t.getDefaultLang()]) label[this.t.getDefaultLang()] = theEnum;

    this.editLabel(theEnum, label);
  }

  save(): Promise<void> {
    this.errors = new Set(this._field.validate(this.t.languages()));
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    this.field.load(this._field, this.t.languages());
    this.close(true);
  }

  close(somethingChanged?: boolean): void {
    this.modalCtrl.dismiss(somethingChanged);
  }
}
