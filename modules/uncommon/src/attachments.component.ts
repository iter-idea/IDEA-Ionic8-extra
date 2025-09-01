import heic2any from 'heic2any';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Platform } from '@ionic/angular';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Attachment } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEATinCanService, IDEAOfflineService } from '@idea-ionic/uncommon';

@Component({
  selector: 'old-idea-attachments',
  imports: [FormsModule, IDEATranslatePipe, IonItem, IonButton, IonIcon, IonInput, IonLabel, IonSpinner],
  template: `
    @for (att of attachments; track att; let index = $index; let odd = $odd) {
      <ion-item
        class="attachments"
        [class.fieldHasError]="hasFieldAnError('attachments[' + index + '].attachmentId')"
        [class.odd]="odd"
        [lines]="lines"
      >
        @if (att.attachmentId && _offline.isOnline()) {
          <ion-button fill="clear" size="small" slot="start" (click)="openAttachment(att)">
            <ion-icon name="open-outline" slot="icon-only" size="small" />
          </ion-button>
        }
        @if (!editMode && att.attachmentId) {
          <ion-icon slot="start" color="medium" [name]="getFormatIcon(att.format)" [title]="att.format" />
        }
        @if (editMode && att.attachmentId) {
          <ion-input
            [(ngModel)]="att.name"
            (ionBlur)="$event.target.value = $event.target.value || _translate._('IDEA_TEAMS.ATTACHMENTS.NO_NAME')"
          />
        }
        @if (editMode && !att.attachmentId) {
          <ion-label class="loadingWarning">
            {{ 'IDEA_TEAMS.ATTACHMENTS.UPLOADING_ATTACHMENT_WARNING' | translate }}
          </ion-label>
        }
        @if (!editMode) {
          <ion-label>{{ att.name }}.{{ att.format }}</ion-label>
        }
        @if (!att.attachmentId) {
          <ion-spinner slot="end" [title]="'IDEA_TEAMS.ATTACHMENTS.UPLOADING' | translate" />
        }
        @if (editMode) {
          <ion-button
            slot="end"
            color="danger"
            fill="clear"
            [title]="'IDEA_TEAMS.ATTACHMENTS.REMOVE_ATTACHMENT' | translate"
            (click)="removeAttachment(att)"
          >
            <ion-icon name="remove" slot="icon-only" />
          </ion-button>
        }
      </ion-item>
    }
    <!----->
    @if (!editMode && !attachments?.length) {
      <ion-item lines="none" class="noAttachments">
        <ion-label>
          {{ 'IDEA_TEAMS.ATTACHMENTS.NO_ATTACHMENT' | translate }}
        </ion-label>
      </ion-item>
    }
    <!----->
    @if (editMode) {
      <div>
        @for (err of uploadErrors; track err) {
          <ion-item class="attachments" [lines]="lines">
            <ion-icon name="alert-circle" slot="start" color="danger" />
            <ion-label color="danger">
              {{ err }}
              <p>{{ 'IDEA_TEAMS.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT' | translate }}</p>
            </ion-label>
            <ion-button
              slot="end"
              color="danger"
              fill="clear"
              [title]="'IDEA_TEAMS.ATTACHMENTS.HIDE_ERROR' | translate"
              (click)="uploadErrors.splice(uploadErrors.indexOf(err), 1)"
            >
              <ion-icon name="close" slot="icon-only" />
            </ion-button>
          </ion-item>
        }
      </div>
    }
    <!----->
    @if (editMode) {
      <ion-item lines="none" class="selectable" (click)="browseFiles()">
        <ion-label color="medium">{{ 'IDEA_TEAMS.ATTACHMENTS.TAP_TO_ADD_ATTACHMENT' | translate }}</ion-label>
        <input
          id="attachmentPicker"
          type="file"
          multiple
          style="display: none"
          (change)="addAttachmentFromFile($event)"
        />
        @if (editMode) {
          <ion-icon slot="end" name="caret-down" class="selectIcon" />
        }
        @if (editMode && isCapacitor()) {
          <ion-button slot="end" fill="clear" color="dark" (click)="takePictureAndAttach($event)">
            <ion-icon slot="icon-only" name="camera" />
          </ion-button>
        }
      </ion-item>
    }
  `,
  styles: [
    `
      .attachments {
        ion-button[slot='start'],
        ion-icon[slot='start'] {
          margin-right: 10px;
        }
        .loadingWarning {
          font-style: italic;
          font-size: 0.8em;
          color: var(--ion-color-medium);
        }
      }
      .noAttachments {
        font-style: italic;
      }
      .selectIcon {
        margin: 0;
        padding-left: 4px;
        font-size: 0.8em;
        color: var(--ion-color-medium);
      }
      .selectable {
        cursor: pointer;
      }
    `
  ]
})
export class OldIDEAttachmentsComponent implements OnInit {
  private _platform = inject(Platform);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _tc = inject(IDEATinCanService);
  private _api = inject(IDEAAWSAPIService);
  _offline = inject(IDEAOfflineService);
  _translate = inject(IDEATranslationsService);

  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() team: string | null = null;
  /**
   * The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
   */
  @Input() pathResource: string[] = [];
  /**
   * The array in which we want to add/remove attachments.
   */
  @Input() attachments: Attachment[] | null = null;
  /**
   * Regulate the mode (view/edit).
   */
  @Input() editMode = false;
  /**
   * Show errors as reported from the parent component.
   */
  @Input() errors = new Set<string>();
  /**
   * The lines attribute of the item.
   */
  @Input() lines = 'none';

  /**
   * URL towards to make API requests, based on the path of the resource.
   */
  requestURL: string;
  /**
   * Stack of errors from the last upload.
   */
  uploadErrors: string[] = [];

  ngOnInit(): void {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this._tc.get('membership').teamId || this._tc.get('teamId');
    this.requestURL = `teams/${this.team}/`;
    if (this.pathResource && this.pathResource.length)
      this.requestURL = this.requestURL.concat(this.pathResource.filter(x => x).join('/'));
  }

  isCapacitor(): boolean {
    return this._platform.is('capacitor');
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  browseFiles(): void {
    document.getElementById('attachmentPicker').click();
  }
  addAttachmentFromFile(ev: any): void {
    this.uploadErrors = new Array<string>();
    const files: FileList = ev.target ? ev.target.files : {};
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      const fullName = file.name.split('.');
      const format = fullName.pop();
      const name = fullName.join('.');
      this.addAttachment(name, format, file);
    }
  }
  async takePictureAndAttach(ev: Event): Promise<void> {
    if (ev) ev.stopPropagation();
    if (!this._platform.is('capacitor') || !Camera) return;
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      source: CameraSource.Camera,
      resultType: CameraResultType.Base64
    });
    const filename = new Date().toISOString();
    const content = this.base64toBlob(image.base64String, 'image/jpeg');
    this.addAttachment(filename, image.format, content);
  }
  private base64toBlob(base64str: string, type: string): Blob {
    const binary = atob(base64str);
    const array = [];
    for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
    return new Blob([new Uint8Array(array)], { type });
  }
  private async addAttachment(name: string, format: string, content: any): Promise<void> {
    if (format === FileFormatTypes.HEIC) {
      format = FileFormatTypes.JPEG;
      content = await heic2any({ blob: content, toType: 'image/jpeg' });
    }
    const attachment = new Attachment({ name, format });
    this.attachments.push(attachment);
    try {
      const signedURL = await this._api.patchResource(this.requestURL, {
        body: { action: 'ATTACHMENTS_PUT', attachmentId: attachment.attachmentId }
      });
      await this._api.rawRequest().put(signedURL.url, content).toPromise();
      attachment.attachmentId = signedURL.id;
    } catch (error) {
      this.uploadErrors.push(name);
      this.removeAttachment(attachment);
      this._message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT');
    }
  }

  removeAttachment(attachment: Attachment): void {
    const index = this.attachments.indexOf(attachment);
    if (index !== -1) this.attachments.splice(index, 1);
  }

  async openAttachment(attachment: Attachment): Promise<void> {
    try {
      await this._loading.show();
      const { url } = await this._api.patchResource(this.requestURL, {
        body: { action: 'ATTACHMENTS_GET', attachmentId: attachment.attachmentId }
      });
      await Browser.open({ url });
    } catch (error) {
      this._message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_OPENING_ATTACHMENT');
    } finally {
      this._loading.hide();
    }
  }

  getFormatIcon(format: string): string {
    switch (format) {
      case FileFormatTypes.JPG:
      case FileFormatTypes.JPEG:
      case FileFormatTypes.PNG:
        return 'image';
      case FileFormatTypes.PDF:
        return 'document';
      default:
        return 'help';
    }
  }
}

/**
 * The possibile file types (formats).
 */
enum FileFormatTypes {
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  PDF = 'pdf',
  HEIC = 'heic'
}
