import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  ModalController,
  AlertController,
  IonReorderGroup,
  IonItem,
  IonLabel,
  IonReorder,
  IonButton,
  IonIcon,
  IonAccordionGroup,
  IonAccordion
} from '@ionic/angular/standalone';
import { AttachmentSection, AttachmentSections, Label } from 'idea-toolbox';

import { IDEAManageAttachmentsSectionComponent } from './manageAttachmentsSection.component';
import { IDEAAttachmentsComponent } from './attachments.component';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-attachment-sections',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IDEAAttachmentsComponent,
    IonIcon,
    IonButton,
    IonReorder,
    IonLabel,
    IonItem,
    IonReorderGroup,
    IonAccordionGroup,
    IonAccordion
  ],
  template: `
    @if (!attachmentSections.sectionsLegend.length) {
      <ion-item lines="none" [color]="color">
        <ion-label>
          <i>{{ 'IDEA_COMMON.ATTACHMENTS.NO_ELEMENTS' | translate }}</i>
        </ion-label>
      </ion-item>
    }
    <ion-accordion-group>
      <ion-reorder-group [disabled]="disabled" (ionItemReorder)="reorderSectionsLegend($event)">
        @for (sectionKey of attachmentSections.sectionsLegend; track sectionKey) {
          @if (disabled) {
            <ion-accordion>
              <ion-item
                slot="header"
                [button]="!disabled"
                [detail]="!disabled"
                [lines]="lines"
                [color]="color"
                (click)="manageSection(sectionKey)"
              >
                <ion-label>
                  {{ attachmentSections.sections[sectionKey].name | label }}
                  <p>{{ attachmentSections.sections[sectionKey].description | label }}</p>
                </ion-label>
              </ion-item>
              <div
                slot="content"
                class="ion-padding-start ion-padding-end"
                [style.background-color]="'var(--ion-color-' + color + ')'"
              >
                <idea-attachments
                  [disabled]="true"
                  [entityPath]="entityPath"
                  [attachments]="attachmentSections.sections[sectionKey].attachments"
                  [acceptedFormats]="acceptedFormats"
                  [multiple]="multiple"
                  [color]="color"
                  (download)="download.emit($event)"
                />
              </div>
            </ion-accordion>
          } @else {
            <ion-item
              slot="header"
              [button]="!disabled"
              [detail]="!disabled"
              [lines]="lines"
              [color]="color"
              (click)="manageSection(sectionKey)"
            >
              <ion-reorder slot="start" />
              <ion-label>
                {{ attachmentSections.sections[sectionKey].name | label }}
                <p>{{ attachmentSections.sections[sectionKey].description | label }}</p>
              </ion-label>
              <ion-button
                slot="end"
                fill="clear"
                color="danger"
                [title]="'COMMON.REMOVE' | translate"
                (click)="removeSection(sectionKey, $event)"
              >
                <ion-icon icon="trash-outline" slot="icon-only" />
              </ion-button>
            </ion-item>
          }
        }
      </ion-reorder-group>
    </ion-accordion-group>
    @if (!disabled) {
      <div class="ion-padding ion-text-center">
        <ion-button size="small" color="primary" (click)="addNewSection()">
          {{ 'IDEA_COMMON.ATTACHMENTS.ADD_SECTION' | translate }}
        </ion-button>
      </div>
    }
  `
})
export class IDEAAttachmentSectionsComponent {
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  /**
   * The attachment sections to display and manage.
   */
  @Input() attachmentSections: AttachmentSections;
  /**
   * The API path to the entity for which we want to manage the attachments.
   */
  @Input() entityPath: string | string[];
  /**
   * The list of accepted formats.
   */
  @Input() acceptedFormats = ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  /**
   * Whether to accept multiple files as target for the browse function.
   */
  @Input() multiple = false;
  /**
   * Whether the component is disabled or not.
   */
  @Input() disabled = false;
  /**
   * Lines preferences for the component.
   */
  @Input() lines: string;
  /**
   * The background color of the component.
   */
  @Input() color: string;
  /**
   * Trigger to download a file by URL.
   */
  @Output() download = new EventEmitter<string>();

  reorderSectionsLegend(ev: any): void {
    this.attachmentSections.sectionsLegend = ev.detail.complete(this.attachmentSections.sectionsLegend);
  }

  async manageSection(s: string): Promise<void> {
    if (this.disabled) return;
    const componentProps = {
      section: this.attachmentSections.sections[s],
      entityPath: this.entityPath,
      disabled: this.disabled,
      lines: this.lines,
      downloadCallback: (url: string): void => this.download.emit(url)
    };
    const modal = await this._modal.create({ component: IDEAManageAttachmentsSectionComponent, componentProps });
    modal.present();
  }

  async removeSection(sectionKey: string, event: Event): Promise<void> {
    if (event) event.stopPropagation();
    let header: string, subHeader: string, buttons: any[];
    if (this.attachmentSections.sections[sectionKey].attachments.length) {
      header = this._translate._('COMMON.REMOVE');
      subHeader = this._translate._('IDEA_COMMON.ATTACHMENTS.DELETE_EMPTY_SECTION');
      buttons = [this._translate._('COMMON.GOT_IT')];
    } else {
      const doRemoveSection = (): void => {
        this.attachmentSections.sectionsLegend.splice(this.attachmentSections.sectionsLegend.indexOf(sectionKey), 1);
        delete this.attachmentSections.sections[sectionKey];
      };
      header = this._translate._('COMMON.REMOVE');
      subHeader = this._translate._('COMMON.ARE_YOU_SURE');
      buttons = [
        { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
        { text: this._translate._('COMMON.CONFIRM'), role: 'destructive', handler: doRemoveSection }
      ];
    }
    const alert = await this._alert.create({ header, subHeader, buttons });
    alert.present();
  }

  async addNewSection(): Promise<void> {
    const doAddNewSection = (data: any): Promise<void> => {
      if (!data.name) return;
      const name = data ? data.name.trim() : null;
      if (!name) return;
      const key = name.replace(/[^\w]/g, ''); // clean the key to avoid weird chars in the JSON
      if (!key.trim()) return;

      if (this.attachmentSections.sectionsLegend.some(x => x === key))
        return this._message.error('IDEA_COMMON.ATTACHMENTS.DUPLICATED_KEY');

      const section = new AttachmentSection(null, this._translate.languages());
      section.name = new Label(null, this._translate.languages());
      section.name[this._translate.getDefaultLang()] = name;

      this.attachmentSections.sections[key] = section;
      this.attachmentSections.sectionsLegend.push(key);

      this.manageSection(key);
    };

    const header = this._translate._('IDEA_COMMON.ATTACHMENTS.ADD_SECTION');
    const message = this._translate._('IDEA_COMMON.ATTACHMENTS.ADD_SECTION_HINT');
    const inputs: any = [{ name: 'name', type: 'text' }];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doAddNewSection }
    ];

    const alert = await this._alert.create({ header, message, inputs, buttons });
    alert.present();
  }
}
