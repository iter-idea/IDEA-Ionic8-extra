import { Component, EventEmitter, OnInit, Output, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonTitle,
  IonListHeader,
  IonLabel,
  IonItem,
  IonInput,
  IonText
} from '@ionic/angular/standalone';
import { AttachmentSection, Label } from 'idea-toolbox';

import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAAttachmentsComponent } from './attachments.component';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALocalizedLabelPipe } from '../translations/label.pipe';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-manage-attachments-section',
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IDEALocalizedLabelPipe,
    IDEAAttachmentsComponent,
    IonText,
    IonInput,
    IonItem,
    IonLabel,
    IonListHeader,
    IonList,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonTitle
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon slot="icon-only" icon="close" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'IDEA_COMMON.ATTACHMENTS.MANAGE_SECTION' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button [title]="'COMMON.SAVE' | translate" (click)="save()">
            <ion-icon slot="icon-only" icon="checkmark-circle" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="editMode">
      <ion-list class="aList">
        <ion-item [lines]="lines()" [class.fieldHasError]="hasFieldAnError('name')">
          <ion-input
            type="text"
            readonly="true"
            labelPlacement="stacked"
            [value]="_section.name | label"
            [placeholder]="'IDEA_COMMON.ATTACHMENTS.SECTION_NAME_P' | translate"
          >
            <div slot="label">
              {{ 'IDEA_COMMON.ATTACHMENTS.SECTION_NAME' | translate }} <ion-text class="obligatoryDot" />
            </div>
          </ion-input>
          <ion-button
            slot="end"
            fill="clear"
            class="marginTop"
            [title]="'COMMON.EDIT' | translate"
            (click)="editName()"
          >
            <ion-icon slot="icon-only" icon="pencil" />
          </ion-button>
        </ion-item>
        <ion-item [lines]="lines()" [class.fieldHasError]="hasFieldAnError('description')">
          <ion-input
            type="text"
            readonly="true"
            labelPlacement="stacked"
            [label]="'IDEA_COMMON.ATTACHMENTS.SECTION_DESCRIPTION' | translate"
            [value]="_section.description | label"
            [placeholder]="'IDEA_COMMON.ATTACHMENTS.SECTION_DESCRIPTION_P' | translate"
          />
          <ion-button
            slot="end"
            fill="clear"
            class="marginTop"
            [title]="'COMMON.EDIT' | translate"
            (click)="editDescription()"
          >
            <ion-icon slot="icon-only" icon="pencil" />
          </ion-button>
        </ion-item>
        <ion-list-header>
          <ion-label>
            <h3>{{ 'IDEA_COMMON.ATTACHMENTS.ATTACHMENTS' | translate }}</h3>
          </ion-label>
        </ion-list-header>
        <idea-attachments
          [entityPath]="entityPath()"
          [attachments]="_section.attachments"
          [acceptedFormats]="acceptedFormats()"
          [multiple]="multiple()"
          [color]="color()"
          [disabled]="false"
          (download)="downloadCallback()($event)"
        />
      </ion-list>
    </ion-content>
  `
})
export class IDEAManageAttachmentsSectionComponent implements OnInit {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The attachments section to manage.
   */
  readonly section = input<AttachmentSection>();
  /**
   * The API path to the entity for which we want to manage the attachments.
   */
  readonly entityPath = input<string | string[]>();
  /**
   * The list of accepted formats.
   */
  readonly acceptedFormats = input(['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx']);
  /**
   * Whether to accept multiple files as target for the browse function.
   */
  readonly multiple = input(true);
  /**
   * Lines preferences for the component.
   */
  readonly lines = input<string>();
  /**
   * The background color of the component.
   */
  readonly color = input<string>();
  /**
   * Trigger a callback in the parent component to download a file by URL.
   */
  readonly downloadCallback = input<(url: string) => void>();

  _section: AttachmentSection;
  errors = new Set<string>();

  ngOnInit(): void {
    this._section = new AttachmentSection(this.section(), this._translate.languages());
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async editName(): Promise<void> {
    await this.editLabel(this._translate._('IDEA_COMMON.ATTACHMENTS.SECTION_NAME'), this._section.name, true);
  }
  async editDescription(): Promise<void> {
    await this.editLabel(this._translate._('IDEA_COMMON.ATTACHMENTS.SECTION_DESCRIPTION'), this._section.description);
  }
  private async editLabel(title: string, label: Label, obligatory = false): Promise<void> {
    const componentProps = { title, label, obligatory };
    const modal = await this._modal.create({ component: IDEALabelerComponent, componentProps });
    modal.present();
  }

  save(): void {
    this.section().load(this._section, this._translate.languages());
    this.close();
  }

  close(): void {
    this._modal.dismiss();
  }
}
