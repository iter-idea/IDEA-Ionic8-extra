import { Component, Input } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController, AlertController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAMessageService } from '../message.service';
import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAIconsComponent } from '../icons/icons.component';

@Component({
  selector: 'idea-custom-field-meta',
  templateUrl: 'customFieldMeta.component.html',
  styleUrls: ['customFieldMeta.component.scss']
})
export class IDEACustomFieldMetaComponent {
  /**
   * The CustomFieldMeta to manage.
   */
  @Input() public field: IdeaX.CustomFieldMeta;
  /**
   * Whether the component is enabled or not.
   */
  @Input() public disabled: boolean;
  /**
   * Lines preferences for the component.
   */
  @Input() public lines: string;
  /**
   * The working copy of the field meta.
   */
  public _field: IdeaX.CustomFieldMeta;
  /**
   * Errors while validating the entity.
   */
  public errors: Set<string>;
  /**
   * Iterable list of the custom field types available.
   */
  public FIELD_TYPES: Array<string> = IdeaX.loopStringEnumKeys(IdeaX.CustomFieldTypes);
  /**
   * Helper to show the enum in the UI.
   */
  public CustomFieldTypes = IdeaX.CustomFieldTypes;

  constructor(
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {
    // mandatory initialization (to make the reorder component working)
    this.disabled = false;
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    this._field = new IdeaX.CustomFieldMeta(this.field, this.t.languages());
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Open the component to edit a label.
   */
  public editLabel(title: string, label: IdeaX.Label) {
    this.modalCtrl
      .create({ component: IDEALabelerComponent, componentProps: { title, label, obligatory: true } })
      .then(modal => modal.present());
  }
  /**
   * Get a label's value.
   */
  public getLabelValue(label: IdeaX.Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Select the characteristic icon for the field.
   */
  public editIcon() {
    this.modalCtrl.create({ component: IDEAIconsComponent }).then(modal => {
      modal.onDidDismiss().then((res: OverlayEventDetail) => {
        if (res.data) this._field.icon = res.data;
      });
      modal.present();
    });
  }

  /**
   * Reorder the options.
   */
  public reorderOptions(ev: any) {
    this._field.enum.splice(ev.detail.to, 0, this._field.enum.splice(ev.detail.from, 1)[0]);
    ev.detail.complete();
  }
  /**
   * Remove an option from the list (after a confirmation prompt).
   */
  public removeOptionByIndex(index: number) {
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: () => {
          const e = this._field.enum[index];
          if (this._field.enumLabels) delete this._field.enumLabels[e];
          this._field.enum.splice(index, 1);
        }
      }
    ];
    this.alertCtrl.create({ header: this.t._('COMMON.ARE_YOU_SURE'), buttons }).then(alert => alert.present());
  }
  /**
   * Add an option to the list.
   */
  public addOption() {
    const header = this.t._('IDEA.CUSTOM_FIELDS.ADD_OPTION');
    const message = this.t._('IDEA.CUSTOM_FIELDS.ADD_OPTION_HINT');
    const inputs: any = [{ name: 'enum', type: 'text' }];
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: (data: any) => {
          if (!data.enum) return;
          // initialize the label
          const label = new IdeaX.Label(null, this.t.languages());
          // set the translation in the default (obligatory) language
          label[this.t.getDefaultLang()] = data.enum;
          // ensure backwards compatibility
          if (!this._field.enumLabels) this._field.enumLabels = {};
          this._field.enumLabels[data.enum] = label;
          if (!this._field.enum) this._field.enum = new Array<string>();
          // add the enum and configure the enumLabel
          this._field.enum.push(data.enum);
          this.editEnumLabel(data.enum);
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
   * Open the component to edit a label.
   */
  public editEnumLabel(theEnum: string) {
    // ensere backwards compatibility
    if (!this._field.enumLabels) this._field.enumLabels = {};
    if (!this._field.enumLabels[theEnum]) this._field.enumLabels[theEnum] = new IdeaX.Label(null, this.t.languages());
    // set the translation in the default (obligatory) language
    const label = this._field.enumLabels[theEnum];
    if (!label[this.t.getDefaultLang()]) label[this.t.getDefaultLang()] = theEnum;
    // configure the label
    this.editLabel(theEnum, label);
  }

  /**
   * Save the field and close.
   */
  public save() {
    // checkings
    this.errors = new Set(this._field.validate(this.t.languages()));
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    // save and close
    this.field.load(this._field, this.t.languages());
    this.close(true);
  }

  /**
   * Close the modal.
   */
  public close(somethingChanged?: boolean) {
    this.modalCtrl.dismiss(somethingChanged);
  }
}
