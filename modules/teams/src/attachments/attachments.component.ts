import { Component, inject, Input, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Platform, IonItem, IonButton, IonIcon, IonInput, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import heic2any from 'heic2any';
import { Attachment } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEAOfflineService, IDEATinCanService } from '@idea-ionic/uncommon';

@Component({
  selector: 'idea-attachments',
  imports: [FormsModule, IDEATranslatePipe, IonSpinner, IonLabel, IonInput, IonIcon, IonButton, IonItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'attachments.component.html',
  styleUrls: ['attachments.component.scss']
})
export class IDEAttachmentsComponent implements OnInit {
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
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() team: string | null = null;
  /**
   * The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
   */
  readonly pathResource = input<string[]>([]);
  /**
   * The array in which we want to add/remove attachments.
   */
  readonly attachments = input<Attachment[] | null>(null);
  /**
   * Regulate the mode (view/edit).
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
  @Input() editMode = false;
  /**
   * Show errors as reported from the parent component.
   */
  readonly errors = input(new Set<string>());
  /**
   * The lines attribute of the item.
   */
  readonly lines = input('none');

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
    const pathResource = this.pathResource();
    if (pathResource && pathResource.length)
      this.requestURL = this.requestURL.concat(pathResource.filter(x => x).join('/'));
  }

  isCapacitor(): boolean {
    return this._platform.is('capacitor');
  }

  hasFieldAnError(field: string): boolean {
    return this.errors().has(field);
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
    this.attachments().push(attachment);
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
    const index = this.attachments().indexOf(attachment);
    if (index !== -1) this.attachments().splice(index, 1);
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
