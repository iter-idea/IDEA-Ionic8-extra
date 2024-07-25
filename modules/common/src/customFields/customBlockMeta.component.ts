import { Component, Input, inject } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { CustomBlockMeta, CustomSectionMeta, Label } from 'idea-toolbox';

import { IDEACustomSectionMetaComponent } from './customSectionMeta.component';

import { IDEATranslationsService } from '../translations/translations.service';
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
  @Input() block: CustomBlockMeta;
  /**
   * Whether the custom sections should manage the display template or it should be hidden.
   */
  @Input() useDisplayTemplate = false;
  /**
   * Whether the component is enabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines: string;

  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  reorderSectionsLegend(ev: any): void {
    this.block.sectionsLegend = ev.detail.complete(this.block.sectionsLegend);
  }

  async openSection(s: string): Promise<void> {
    const componentProps = {
      section: this.block.sections[s],
      useDisplayTemplate: this.useDisplayTemplate,
      disabled: this.disabled,
      lines: this.lines
    };
    const modal = await this._modal.create({ component: IDEACustomSectionMetaComponent, componentProps });
    await modal.present();
  }

  async removeSection(s: string, ev: any): Promise<void> {
    if (ev) ev.stopPropagation();

    const doRemoveSection = (): void => {
      this.block.sectionsLegend.splice(this.block.sectionsLegend.indexOf(s), 1);
      delete this.block.sections[s];
    };
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doRemoveSection }
    ];
    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const alert = await this._alert.create({ header, buttons });
    await alert.present();
  }

  async addNewSection(): Promise<void> {
    const doAddNewSection = (data: any): Promise<void> => {
      if (!data.name) return;
      const name = data ? data.name.trim() : null;
      if (!name) return;
      // clean the key to avoid weird chars in the JSON
      const key = name.replace(/[^\w]/g, '');
      if (!key.trim()) return;
      // check wheter the key is unique
      if (this.block.sectionsLegend.some(x => x === key))
        return this._message.error('IDEA_COMMON.CUSTOM_FIELDS.DUPLICATED_KEY');
      // initialize a new section
      const section = new CustomSectionMeta(null, this._translate.languages());
      // initialize the name of the section
      section.name = new Label(null, this._translate.languages());
      section.name[this._translate.getDefaultLang()] = name;
      // add the section to the block
      this.block.sections[key] = section;
      this.block.sectionsLegend.push(key);
      // open the section to configure it
      this.openSection(key);
    };

    const header = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_SECTION');
    const message = this._translate._('IDEA_COMMON.CUSTOM_FIELDS.ADD_SECTION_HINT');
    const inputs: any = [{ name: 'name', type: 'text' }];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doAddNewSection }
    ];

    const alert = await this._alert.create({ header, message, inputs, buttons });
    await alert.present();

    const firstInput: any = document.querySelector('ion-alert input');
    firstInput.focus();
  }
}
