import heic2any from 'heic2any';
import { Component, Input, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Attachment } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService,
  IDEAOfflineService
} from '@idea-ionic/common';

@Component({
  selector: 'idea-attachments',
  templateUrl: 'attachments.component.html',
  styleUrls: ['attachments.component.scss']
})
export class IDEAttachmentsComponent implements OnInit {
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

  constructor(
    private platform: Platform,
    private loading: IDEALoadingService,
    private message: IDEAMessageService,
    private tc: IDEATinCanService,
    private api: IDEAAWSAPIService,
    public offline: IDEAOfflineService,
    public t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this.tc.get('membership').teamId || this.tc.get('teamId');
    // build the URL target of the requests
    this.requestURL = `teams/${this.team}/`;
    if (this.pathResource && this.pathResource.length)
      this.requestURL = this.requestURL.concat(this.pathResource.filter(x => x).join('/'));
  }

  isCapacitor(): boolean {
    return this.platform.is('capacitor');
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
    if (!this.platform.is('capacitor') || !Camera) return;
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
      const signedURL = await this.api.patchResource(this.requestURL, {
        body: { action: 'ATTACHMENTS_PUT', attachmentId: attachment.attachmentId }
      });
      await this.api.rawRequest().put(signedURL.url, content).toPromise();
      attachment.attachmentId = signedURL.id;
    } catch (error) {
      this.uploadErrors.push(name);
      this.removeAttachment(attachment);
      this.message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT');
    }
  }

  removeAttachment(attachment: Attachment): void {
    const index = this.attachments.indexOf(attachment);
    if (index !== -1) this.attachments.splice(index, 1);
  }

  async openAttachment(attachment: Attachment): Promise<void> {
    try {
      await this.loading.show();
      const { url } = await this.api.patchResource(this.requestURL, {
        body: { action: 'ATTACHMENTS_GET', attachmentId: attachment.attachmentId }
      });
      await Browser.open({ url });
    } catch (error) {
      this.message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_OPENING_ATTACHMENT');
    } finally {
      this.loading.hide();
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
