import { Component, Input, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Attachment, SignedURL } from 'idea-toolbox';
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
  @Input() public team: string;
  /**
   * The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
   */
  @Input() public pathResource: string[];
  /**
   * The array in which we want to add/remove attachments.
   */
  @Input() public attachments: Attachment[];
  /**
   * Regulate the mode (view/edit).
   */
  @Input() public editMode: boolean;
  /**
   * Show errors as reported from the parent component.
   */
  @Input() public errors: Set<string>;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;

  /**
   * URL towards to make API requests, based on the path of the resource.
   */
  public requestURL: string;
  /**
   * Stack of errors from the last upload.
   */
  public uploadErrors: string[];

  constructor(
    public platform: Platform,
    public t: IDEATranslationsService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public offline: IDEAOfflineService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService
  ) {
    this.team = null;
    this.pathResource = new Array<string>();
    this.attachments = null;
    this.editMode = false;
    this.lines = 'none';
    this.errors = new Set<string>();
    this.uploadErrors = new Array<string>();
  }
  public ngOnInit() {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this.tc.get('membership').teamId || this.tc.get('teamId');
    // Build the URL target of the requests
    this.requestURL = `teams/${this.team}/`;
    if (this.pathResource && this.pathResource.length)
      this.requestURL = this.requestURL.concat(this.pathResource.filter(x => x).join('/'));
  }

  /**
   * Browse the local files to select an attachment.
   */
  public browseFiles() {
    document.getElementById('attachmentPicker').click();
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Add an attachment from a file picked.
   */
  public addAttachmentFromFile(ev: any) {
    this.uploadErrors = new Array<string>();
    const files: FileList = ev.target ? ev.target.files : {};
    for (let i = 0; i < files.length; i++) {
      // prepare the attachment metadata
      const file = files.item(i);
      const fullName = file.name.split('.');
      const format = fullName.pop();
      const name = fullName.join('.');
      // add the attachment
      this.addAttachment(name, format, file);
    }
  }
  /**
   * Open the camera and take a picture to then add it to the attachments.
   */
  public takePictureAndAttach(ev: Event) {
    if (ev) ev.stopPropagation();
    // go on only if the platform supports the camera
    if (!this.platform.is('capacitor') || !Camera) return;
    // take a picture
    Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      source: CameraSource.Camera,
      resultType: CameraResultType.Base64
    }).then((image: Photo) => {
      const filename = new Date().toISOString();
      const content = this.base64toBlob(image.base64String, 'image/jpeg');
      this.addAttachment(filename, image.format, content);
    });
  }
  /**
   * Convert a base64 string to Blob.
   */
  protected base64toBlob(base64str: string, type: string): Blob {
    const binary = atob(base64str);
    const array = [];
    for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
    return new Blob([new Uint8Array(array)], { type });
  }
  /**
   * Add an attachment to the array, request the signed URL and upload the file.
   * Finally, set the attachment as complete (by assigning the id).
   */
  protected addAttachment(name: string, format: string, content: any) {
    // prepare the attachment metadata
    const attachment = new Attachment({ name, format });
    // add the attachment to the list
    this.attachments.push(attachment);
    // request a URL to upload the file
    this.API.patchResource(this.requestURL, {
      body: { action: 'ATTACHMENTS_PUT', attachmentId: attachment.attachmentId }
    })
      .then((signedURL: SignedURL) => {
        // upload the file
        this.API.rawRequest()
          .put(signedURL.url, content)
          .toPromise()
          .then(() => (attachment.attachmentId = signedURL.id))
          .catch(() => {
            this.uploadErrors.push(name);
            this.removeAttachment(attachment);
            this.message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT');
          });
      })
      .catch(() => {
        this.uploadErrors.push(name);
        this.removeAttachment(attachment);
        this.message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT');
      });
  }

  /**
   * Remove an attachment from the ones previously added.
   */
  public removeAttachment(attachment: Attachment) {
    this.attachments.splice(this.attachments.indexOf(attachment), 1);
  }

  /**
   * Request the attachment and open it.
   */
  public async openAttachment(attachment: Attachment) {
    await this.loading.show();
    this.API.patchResource(this.requestURL, {
      body: { action: 'ATTACHMENTS_GET', attachmentId: attachment.attachmentId }
    })
      .then((res: SignedURL) => Browser.open({ url: res.url }))
      .catch(() => this.message.error('IDEA_TEAMS.ATTACHMENTS.ERROR_OPENING_ATTACHMENT'))
      .finally(() => this.loading.hide());
  }

  /**
   * Return the name of an icon representing the format.
   */
  public getFormatIcon(format: string): string {
    switch (format) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      case 'pdf':
        return 'document';
      default:
        return 'help';
    }
  }
}
