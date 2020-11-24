import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEACustomSectionMetaComponent } from './customSectionMeta.component';
import { IDEAMessageService } from '../message.service';

@Component({
  selector: 'idea-custom-block-meta',
  templateUrl: 'customBlockMeta.component.html',
  styleUrls: ['customBlockMeta.component.scss']
})
export class IDEACustomBlockMetaComponent {
  /**
   * The CustomBlockMeta to manage.
   */
  @Input() public block: IdeaX.CustomBlockMeta;
  /**
   * Whether the custom sections should manage the display template or it should be hidden.
   */
  @Input() public useDisplayTemplate: boolean;
  /**
   * Whether the component is enabled or not.
   */
  @Input() public disabled: boolean;
  /**
   * Lines preferences for the component.
   */
  @Input() public lines: string;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {
    // mandatory initialization (to make the reorder component working)
    this.disabled = false;
  }

  /**
   * Get a label's value.
   */
  public getLabelValue(label: IdeaX.Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Reorder the sections legend.
   */
  public reorderSectionsLegend(ev: any) {
    this.block.sectionsLegend.splice(ev.detail.to, 0, this.block.sectionsLegend.splice(ev.detail.from, 1)[0]);
    ev.detail.complete();
  }

  /**
   * Open a custom section meta component.
   */
  public openSection(s: string) {
    this.modalCtrl
      .create({
        component: IDEACustomSectionMetaComponent,
        componentProps: {
          section: this.block.sections[s],
          useDisplayTemplate: this.useDisplayTemplate,
          disabled: this.disabled,
          lines: this.lines
        }
      })
      .then(modal => modal.present());
  }

  /**
   * Remove a section.
   */
  public removeSection(s: string, ev: any) {
    if (ev) ev.stopPropagation();
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: () => {
          this.block.sectionsLegend.splice(this.block.sectionsLegend.indexOf(s), 1);
          delete this.block.sections[s];
        }
      }
    ];
    this.alertCtrl.create({ header: this.t._('COMMON.ARE_YOU_SURE'), buttons }).then(alert => alert.present());
  }

  /**
   * Add a new section to the custom block.
   */
  public addNewSection() {
    const header = this.t._('IDEA.CUSTOM_FIELDS.ADD_SECTION');
    const message = this.t._('IDEA.CUSTOM_FIELDS.ADD_SECTION_HINT');
    const inputs: any = [{ name: 'name', type: 'text' }];
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: (data: any) => {
          if (!data.name) return;
          const name = data ? data.name.trim() : null;
          if (!name) return;
          // clean the key to avoid weird chars in the JSON
          const key = name.replace(/[^\w\d]/g, '');
          if (!key.trim()) return;
          // check wheter the key is unique
          if (this.block.sectionsLegend.some(x => x === key))
            return this.message.error('IDEA.CUSTOM_FIELDS.DUPLICATED_KEY');
          // initialize a new section
          const section = new IdeaX.CustomSectionMeta(null, this.t.languages());
          // initialize the name of the section
          section.name = new IdeaX.Label(null, this.t.languages());
          section.name[this.t.getDefaultLang()] = name;
          // add the section to the block
          this.block.sections[key] = section;
          this.block.sectionsLegend.push(key);
          // open the section to configure it
          this.openSection(key);
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
}
