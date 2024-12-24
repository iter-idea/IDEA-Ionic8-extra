import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonSpinner
} from '@ionic/angular/standalone';
import { Attachment } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAAttachmentsService } from './attachments.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonItem,
    IonInput,
    IonLabel,
    IonNote,
    IonSpinner,
    IonButton,
    IonIcon,
    IonItemDivider,
    IonReorderGroup,
    IonReorder
  ],
  selector: 'idea-attachments',
  template: `
    <ion-reorder-group [disabled]="disabled" (ionItemReorder)="reorderAttachments($event)">
      @for (att of attachments; track att.attachmentId) {
        <ion-item class="attachmentItem" [color]="color" [lines]="!disabled ? 'inset' : 'none'">
          @if (!disabled) {
            <ion-reorder slot="start" />
            <ion-input [(ngModel)]="att.name" />
            <ion-note slot="end">.{{ att.format }}</ion-note>
            @if (!att.attachmentId) {
              <ion-spinner
                size="small"
                color="medium"
                slot="end"
                [title]="'IDEA_COMMON.ATTACHMENTS.UPLOADING' | translate"
              />
            }
            <ion-button
              slot="end"
              color="danger"
              fill="clear"
              [title]="'IDEA_COMMON.ATTACHMENTS.REMOVE_ATTACHMENT' | translate"
              (click)="removeAttachment(att)"
            >
              <ion-icon icon="remove" slot="icon-only" />
            </ion-button>
          } @else {
            <ion-label class="ion-text-wrap">{{ att.name }}.{{ att.format }}</ion-label>
          }
          @if (att.attachmentId) {
            <ion-button
              slot="end"
              color="medium"
              fill="clear"
              [title]="'IDEA_COMMON.ATTACHMENTS.DOWNLOAD_ATTACHMENT' | translate"
              (click)="downloadAttachment(att)"
            >
              <ion-icon icon="cloud-download-outline" slot="icon-only" />
            </ion-button>
          }
        </ion-item>
      } @empty {
        @if (disabled) {
          <ion-item lines="none" [color]="color">
            <ion-label>
              <i>{{ 'IDEA_COMMON.ATTACHMENTS.NO_ATTACHMENTS' | translate }}</i>
            </ion-label>
          </ion-item>
        }
      }
    </ion-reorder-group>
    @if (!disabled) {
      <ion-item button [color]="color" (click)="browseFiles()">
        <input
          #filePicker
          type="file"
          style="display: none"
          [multiple]="multiple"
          [accept]="acceptedFormats.join(',')"
          (change)="addAttachmentsFromPicker($event.target)"
        />
        <ion-label>
          <i>{{ 'IDEA_COMMON.ATTACHMENTS.TAP_TO_ADD_ATTACHMENT' | translate }}</i>
        </ion-label>
      </ion-item>
      @for (err of uploadErrors; track $index) {
        <ion-item class="attachmentItem error" [color]="color">
          <ion-label color="danger" class="ion-text-wrap">
            {{ err.file }}
            <p>{{ err.error || ('IDEA_COMMON.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT' | translate) }}</p>
          </ion-label>
          <ion-button
            slot="end"
            color="danger"
            fill="clear"
            [title]="'IDEA_COMMON.ATTACHMENTS.HIDE_ERROR' | translate"
            (click)="removeErrorFromList(err)"
          >
            <ion-icon name="close" slot="icon-only" />
          </ion-button>
        </ion-item>
      }
      <ion-item-divider [color]="color">
        <ion-label>
          {{
            'IDEA_COMMON.ATTACHMENTS.ALLOWED_FORMATS_AND_SIZE'
              | translate: { formats: acceptedFormats.join(', '), size: maxSize }
          }}
        </ion-label>
      </ion-item-divider>
    }
  `,
  styles: [
    `
      ion-item.attachmentItem {
        --padding-start: 16px;
        --padding-end: 0;
      }
      ion-item.attachmentItem.error ion-label {
        font-size: 0.8em;
        p {
          font-size: 0.8em;
        }
      }
      ion-item-divider ion-label {
        font-size: 0.8em;
      }
    `
  ]
})
export class IDEAAttachmentsComponent {
  protected _env = inject(IDEAEnvironment);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);
  private _attachments = inject(IDEAAttachmentsService);

  /**
   * The array of attachments to display and manage.
   */
  @Input() attachments: Attachment[];
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
   * Whether we are viewing or editing the attachments.
   */
  @Input() disabled = true;
  /**
   * The background color of the component.
   */
  @Input() color: string;
  /**
   * Trigger to download a file by URL.
   */
  @Output() download = new EventEmitter<string>();

  @ViewChild('filePicker') attachmentPicker: any;

  uploadErrors: UploadError[] = [];
  maxSize = this._env.idea.app.maxFileUploadSizeMB;

  async browseFiles(): Promise<void> {
    this.attachmentPicker.nativeElement.click();
  }
  addAttachmentsFromPicker(target: HTMLInputElement): void {
    this.uploadErrors = [];
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files.item(i);
      const fullName = file.name.split('.');
      const format = fullName.pop();
      const name = fullName.join('.');
      this.addAttachmentToListAndUpload(new Attachment({ name, format }), file);
    }
    // empty the file picker to allow the upload of new files with the same name
    target.value = null;
  }
  private async addAttachmentToListAndUpload(attachment: Attachment, file: File): Promise<void> {
    try {
      this.attachments.push(attachment);
      attachment.attachmentId = await this._attachments.uploadAndGetId(file, this.entityPath);
    } catch (err: any) {
      if (err.message === 'File is too big')
        err.message = this._translate._('IDEA_COMMON.ATTACHMENTS.FILE_IS_TOO_BIG', { maxSize: this.maxSize });
      this.uploadErrors.push({ file: attachment.name, error: err.message });
      this.removeAttachment(attachment);
      this._message.error(err.message, true);
    }
  }

  removeAttachment(attachment: Attachment): void {
    this.attachments.splice(this.attachments.indexOf(attachment), 1);
  }
  removeErrorFromList(err: UploadError): void {
    const indexErr = this.uploadErrors.indexOf(err);
    if (indexErr !== -1) this.uploadErrors.splice(this.uploadErrors.indexOf(err), 1);
  }

  reorderAttachments(ev: any): void {
    this.attachments = ev.detail.complete(this.attachments);
  }

  async downloadAttachment(attachment: Attachment): Promise<void> {
    try {
      await this._loading.show();
      const url = await this._attachments.getDownloadURL(attachment, this.entityPath);
      this.download.emit(url);
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }
}

interface UploadError {
  file: string;
  error: string;
}
