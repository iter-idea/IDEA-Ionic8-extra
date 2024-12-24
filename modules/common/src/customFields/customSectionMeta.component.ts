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
  IonContent,
  IonList,
  IonReorderGroup,
  IonTitle,
  IonListHeader,
  IonLabel,
  IonItem,
  IonInput,
  IonText,
  IonReorder,
  IonBadge,
  IonRow,
  IonCol,
  IonItemDivider
} from '@ionic/angular/standalone';
import { CustomFieldMeta, CustomSectionMeta, Label, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEAMessageService } from '../message.service';
import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

import { IDEACustomFieldMetaComponent } from './customFieldMeta.component';

@Component({
  selector: 'idea-custom-section-meta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IonItemDivider,
    IonCol,
    IonRow,
    IonBadge,
    IonReorder,
    IonText,
    IonInput,
    IonItem,
    IonLabel,
    IonListHeader,
    IonReorderGroup,
    IonList,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonTitle
  ],
  templateUrl: 'customSectionMeta.component.html',
  styleUrls: ['customSectionMeta.component.scss']
})
export class IDEACustomSectionMetaComponent implements OnInit {
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  /**
   * The CustomSectionMeta to manage.
   */
  @Input() section: CustomSectionMeta;
  /**
   * Whether to hide the headers of the section (in case we just want to display/manage the fields).
   */
  @Input() hideHeaders = false;
  /**
   * Whether the CustomSectionMeta should manage the display template or it should be hidden.
   */
  @Input() useDisplayTemplate = false;
  /**
   * Whether the compoent is enabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines: string;

  _section: CustomSectionMeta;
  errors = new Set<string>();
  DISPLAY_TEMPLATE_MAX_NUM_FIELD_PER_ROW = 3;

  ngOnInit(): void {
    this._section = new CustomSectionMeta(this.section, this._translate.languages());
    // ensure backwards compatibility
    if (this.useDisplayTemplate && !this._section.displayTemplate) this._section.displayTemplate = [];
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async editName(): Promise<void> {
    // since the name is optional, set it if it's requested but not set
    if (!this._section.name) {
      this._section.name = new Label(null, this._translate.languages());
      this._section.name[this._translate.getDefaultLang()] = '-';
    }
    await this.editLabel(this._translate._('IDEA_COMMON.CUSTOM_FIELDS.NAME'), this._section.name);
  }
  async editDescription(): Promise<void> {
    // since the description is optional, set it if it's requested but not set
    if (!this._section.description) {
      this._section.description = new Label(null, this._translate.languages());
      this._section.description[this._translate.getDefaultLang()] = '-';
    }
    await this.editLabel(this._translate._('IDEA_COMMON.CUSTOM_FIELDS.DESCRIPTION'), this._section.description);
  }
  private async editLabel(title: string, label: Label): Promise<void> {
    const componentProps = { title, label, obligatory: true };
    const modal = await this._modal.create({ component: IDEALabelerComponent, componentProps });
    await modal.present();
  }
  reorderFieldsLegend(ev: any): void {
    this._section.fieldsLegend = ev.detail.complete(this._section.fieldsLegend);
  }
  async openField(f: string): Promise<void> {
    const componentProps = { field: this._section.fields[f], disabled: this.disabled, lines: this.lines };
    const modal = await this._modal.create({ component: IDEACustomFieldMetaComponent, componentProps });
    await modal.present();
  }
  async removeField(f: string, ev: any): Promise<void> {
    if (ev) ev.stopPropagation();

    const doRemoveField = (): void => {
      this._section.fieldsLegend.splice(this._section.fieldsLegend.indexOf(f), 1);
      delete this._section.fields[f];
      // filter out of the displayTemplate the fields which aren't in the fieldsLegend
      if (this._section.displayTemplate)
        this._section.displayTemplate.forEach(
          (row, i, arr): string[] => (arr[i] = row.filter(el => this._section.fieldsLegend.some(field => field === el)))
        );
    };
    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doRemoveField }
    ];

    const alert = await this._alert.create({ header, buttons });
    await alert.present();
  }
  async addNewField(): Promise<void> {
    const doAddNewField = (data: any): Promise<void> => {
      const name = data ? data.name.trim() : null;
      if (!name) return;
      // clean the key to avoid weird chars in the JSON
      const key = name.replace(/[^\w]/g, '');
      if (!key.trim()) return;
      // check wheter the key is unique
      if (this._section.fieldsLegend.some(x => x === key))
        return this._message.error('IDEA_COMMON.CUSTOM_FIELDS.DUPLICATED_KEY');
      // initialize a new field
      const field = new CustomFieldMeta(null, this._translate.languages());
      // initialize the name of the field
      field.name = new Label(null, this._translate.languages());
      field.name[this._translate.getDefaultLang()] = name;
      // add the field to the section
      this._section.fields[key] = field;
      this._section.fieldsLegend.push(key);
      // open the field to configure it
      this.openField(key);
    };
    const header = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD');
    const message = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD_HINT');
    const inputs: any = [{ name: 'name', type: 'text' }];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doAddNewField }
    ];

    const alert = await this._alert.create({ header, message, inputs, buttons });
    await alert.present();

    const firstInput: HTMLInputElement = document.querySelector('ion-alert input');
    firstInput.focus();
  }

  reorderDisplayTemplateRows(ev: any): void {
    this._section.displayTemplate = ev.detail.complete(this._section.displayTemplate);
  }
  isDisplayTemplateRowFull(row: number): boolean {
    return this._section.displayTemplate[row].length === this.DISPLAY_TEMPLATE_MAX_NUM_FIELD_PER_ROW;
  }
  addNewDisplayTemplateRow(): void {
    this._section.displayTemplate.push([]);
  }
  async addFieldToDisplayTemplateRow(row: number): Promise<void> {
    const componentProps = {
      data: this._section.fieldsLegend.map(
        x => new Suggestion({ value: x, name: this._translate._label(this._section.fields[x].name) })
      ),
      searchPlaceholder: this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD'),
      hideIdFromUI: true,
      hideClearButton: true
    };

    const modal = await this._modal.create({ component: IDEASuggestionsComponent, componentProps });
    modal.onDidDismiss().then(selection => {
      const field = selection && selection.data ? selection.data.value : null;
      if (field) this._section.displayTemplate[row].push(field);
    });
    await modal.present();
  }

  removeFieldToDisplayTemplateRow(row: number, field: string): void {
    this._section.displayTemplate[row].splice(this._section.displayTemplate[row].indexOf(field), 1);
  }
  private cleanEmptyDisplayTemplateRows(): void {
    this._section.displayTemplate = this._section.displayTemplate.filter(r => r.length);
  }

  save(): Promise<void> {
    this.errors = new Set(this._section.validate(this._translate.languages()));
    if (this.errors.size) return this._message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');

    if (this.useDisplayTemplate) this.cleanEmptyDisplayTemplateRows();

    this.section.load(this._section, this._translate.languages());
    this.close();
  }

  close(): void {
    this._modal.dismiss();
  }
}
