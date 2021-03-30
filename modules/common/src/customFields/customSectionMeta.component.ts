import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { CustomFieldMeta, CustomSectionMeta, Label, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEACustomFieldMetaComponent } from './customFieldMeta.component';
import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAMessageService } from '../message.service';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

@Component({
  selector: 'idea-custom-section-meta',
  templateUrl: 'customSectionMeta.component.html',
  styleUrls: ['customSectionMeta.component.scss']
})
export class IDEACustomSectionMetaComponent {
  /**
   * The CustomSectionMeta to manage.
   */
  @Input() public section: CustomSectionMeta;
  /**
   * Whether to hide the headers of the section (in case we just want to display/manage the fields).
   */
  @Input() public hideHeaders: boolean;
  /**
   * Whether the CustomSectionMeta should manage the display template or it should be hidden.
   */
  @Input() public useDisplayTemplate: boolean;
  /**
   * Whether the compoent is enabled or not.
   */
  @Input() public disabled: boolean;
  /**
   * Lines preferences for the component.
   */
  @Input() public lines: string;
  /**
   * The working copy of the section meta.
   */
  public _section: CustomSectionMeta;
  /**
   * Errors while validating the entity.
   */
  public errors: Set<string>;
  /**
   * The maximium number of fields per row.
   */
  public DISPLAY_TEMPLATE_MAX_NUM_FIELD_PER_ROW = 3;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {
    // mandatory initialization (to make the reorder component working)
    this.disabled = false;
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    this._section = new CustomSectionMeta(this.section, this.t.languages());
    // ensure backwards compatibility
    if (this.useDisplayTemplate && !this._section.displayTemplate)
      this._section.displayTemplate = new Array<string[]>();
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Edit the name of the section.
   */
  public editName() {
    // since the name is optional, set it if it's requested but not set
    if (!this._section.name) {
      this._section.name = new Label(null, this.t.languages());
      this._section.name[this.t.getDefaultLang()] = '-';
    }
    this.editLabel(this.t._('IDEA_COMMON.CUSTOM_FIELDS.NAME'), this._section.name);
  }
  /**
   * Edit the description of the section.
   */
  public editDescription() {
    // since the description is optional, set it if it's requested but not set
    if (!this._section.description) {
      this._section.description = new Label(null, this.t.languages());
      this._section.description[this.t.getDefaultLang()] = '-';
    }
    this.editLabel(this.t._('IDEA_COMMON.CUSTOM_FIELDS.DESCRIPTION'), this._section.description);
  }
  /**
   * Open the component to edit a label.
   */
  protected editLabel(title: string, label: Label) {
    this.modalCtrl
      .create({ component: IDEALabelerComponent, componentProps: { title, label, obligatory: true } })
      .then(modal => modal.present());
  }
  /**
   * Get a label's value.
   */
  public getLabelValue(label: Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Reorder the fields legend.
   */
  public reorderFieldsLegend(ev: any) {
    this._section.fieldsLegend.splice(ev.detail.to, 0, this._section.fieldsLegend.splice(ev.detail.from, 1)[0]);
    ev.detail.complete();
  }
  /**
   * Open a custom field meta component.
   */
  public openField(f: string) {
    this.modalCtrl
      .create({
        component: IDEACustomFieldMetaComponent,
        componentProps: { field: this._section.fields[f], disabled: this.disabled, lines: this.lines }
      })
      .then(modal => modal.present());
  }
  /**
   * Remove a field.
   */
  public removeField(f: string, ev: any) {
    if (ev) ev.stopPropagation();
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: () => {
          this._section.fieldsLegend.splice(this._section.fieldsLegend.indexOf(f), 1);
          delete this._section.fields[f];
          // filter out of the displayTemplate the fields which aren't in the fieldsLegend
          if (this._section.displayTemplate)
            this._section.displayTemplate.forEach(
              (row, i, arr) => (arr[i] = row.filter(el => this._section.fieldsLegend.some(field => field === el)))
            );
        }
      }
    ];
    this.alertCtrl.create({ header: this.t._('COMMON.ARE_YOU_SURE'), buttons }).then(alert => alert.present());
  }
  /**
   * Add a new field to the custom section.
   */
  public addNewField() {
    const header = this.t._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD');
    const message = this.t._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD_HINT');
    const inputs: any = [{ name: 'name', type: 'text' }];
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: (data: any) => {
          const name = data ? data.name.trim() : null;
          if (!name) return;
          // clean the key to avoid weird chars in the JSON
          const key = name.replace(/[^\w]/g, '');
          if (!key.trim()) return;
          // check wheter the key is unique
          if (this._section.fieldsLegend.some(x => x === key))
            return this.message.error('IDEA_COMMON.CUSTOM_FIELDS.DUPLICATED_KEY');
          // initialize a new field
          const field = new CustomFieldMeta(null, this.t.languages());
          // initialize the name of the field
          field.name = new Label(null, this.t.languages());
          field.name[this.t.getDefaultLang()] = name;
          // add the field to the section
          this._section.fields[key] = field;
          this._section.fieldsLegend.push(key);
          // open the field to configure it
          this.openField(key);
        }
      }
    ];
    this.alertCtrl.create({ header, message, inputs, buttons }).then(alert =>
      alert.present().then(() => {
        const firstInput: any = document.querySelector('ion-alert input');
        firstInput.focus();
        return;
      })
    );
  }

  /**
   * Reorder the rows of the display template.
   */
  public reorderDisplayTemplateRows(ev: any) {
    this._section.displayTemplate.splice(ev.detail.to, 0, this._section.displayTemplate.splice(ev.detail.from, 1)[0]);
    ev.detail.complete();
  }
  /**
   * Check whether the row is full or has empty spots for new fields.
   */
  public isDisplayTemplateRowFull(row: number): boolean {
    return this._section.displayTemplate[row].length === this.DISPLAY_TEMPLATE_MAX_NUM_FIELD_PER_ROW;
  }
  /**
   * Add a new row to the display template.
   */
  public addNewDisplayTemplateRow() {
    this._section.displayTemplate.push(new Array<string>());
  }
  /**
   * Add a field to a row, chosen among the fields available in the section.
   */
  public addFieldToDisplayTemplateRow(row: number) {
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: {
          data: this._section.fieldsLegend.map(
            x => new Suggestion({ value: x, name: this.getLabelValue(this._section.fields[x].name) })
          ),
          searchPlaceholder: this.t._('IDEA_COMMON.CUSTOM_FIELDS.ADD_FIELD'),
          hideIdFromUI: true,
          hideClearButton: true
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(selection => {
          const field = selection && selection.data ? selection.data.value : null;
          if (field) this._section.displayTemplate[row].push(field);
        });
        modal.present();
      });
  }
  /**
   * Remove a field from a display template row.
   */
  public removeFieldToDisplayTemplateRow(row: number, field: string) {
    this._section.displayTemplate[row].splice(this._section.displayTemplate[row].indexOf(field), 1);
  }
  /**
   * Remove empty display template rows.
   */
  private cleanEmptyDisplayTemplateRows() {
    this._section.displayTemplate = this._section.displayTemplate.filter(r => r.length);
  }

  /**
   * Return the modified field and close.
   */
  public save() {
    // checkings
    this.errors = new Set(this._section.validate(this.t.languages()));
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    // remove empty display template rows
    if (this.useDisplayTemplate) this.cleanEmptyDisplayTemplateRows();
    // save and close
    this.section.load(this._section, this.t.languages());
    this.close();
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
