import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEADownloaderURL } from '../downloader/downloader.component';
import { IDEAMessageService } from '../message.service';

@Component({
  selector: 'idea-attachments',
  templateUrl: 'attachments.component.html',
  styleUrls: ['attachments.component.scss']
})
export class IDEAttachmentsComponent {
  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() public team: string;
  /**
   * The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
   */
  @Input() public pathResource: Array<string>;
  /**
   * The array in which we want to add/remove attachments.
   */
  @Input() public attachments: Array<IdeaX.Attachment>;
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
   * Support variable to trigger file downloads.
   */
  public download: IDEADownloaderURL;
  /**
   * URL towards to make API requests, based on the path of the resource.
   */
  public requestURL: string;
  /**
   * Stack of errors from the last upload.
   */
  public uploadErrors: Array<string>;

  constructor(
    public t: TranslateService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService
  ) {
    this.team = null;
    this.pathResource = new Array<string>();
    this.attachments = null;
    this.editMode = false;
    this.lines = 'none';
    this.errors = new Set<string>();
    this.download = null;
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
   * Add an attachment to the array, request the signed URL and upload the file.
   * Finally, set the attachment as complete (by assigning the id).
   */
  public addAttachment(ev: any) {
    this.uploadErrors = new Array<string>();
    const files: FileList = ev.target ? ev.target.files : {};
    for (let i = 0; i < files.length; i++) {
      // prepare the attachment metadata
      const file = files.item(i);
      const fullName = file.name.split('.');
      const format = fullName.pop();
      const name = fullName.join('.');
      const attachment = new IdeaX.Attachment({ name, format });
      // add the attachment to the list
      this.attachments.push(attachment);
      // request a URL to upload the file
      this.API.patchResource(this.requestURL, {
        body: { action: 'ATTACHMENTS_PUT', attachmentId: attachment.attachmentId }
      })
        .then((signedURL: IdeaX.SignedURL) => {
          // upload the file
          this.API.rawRequest()
            .put(signedURL.url, file)
            .toPromise()
            .then(() => (attachment.attachmentId = signedURL.id))
            .catch(() => {
              this.uploadErrors.push(file.name);
              this.removeAttachment(attachment);
              this.message.error('IDEA.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT');
            });
        })
        .catch(() => {
          this.uploadErrors.push(file.name);
          this.removeAttachment(attachment);
          this.message.error(`IDEA.ATTACHMENTS.ERROR_UPLOADING_ATTACHMENT`);
        });
    }
  }

  /**
   * Remove an attachment from the ones previously added.
   */
  public removeAttachment(attachment: IdeaX.Attachment) {
    this.attachments.splice(this.attachments.indexOf(attachment), 1);
  }

  /**
   * Request the attachment and open it.
   */
  public openAttachment(attachment: IdeaX.Attachment) {
    this.loading.show();
    this.API.patchResource(this.requestURL, {
      body: { action: 'ATTACHMENTS_GET', attachmentId: attachment.attachmentId }
    })
      .then((res: IdeaX.SignedURL) => (this.download = new IDEADownloaderURL(res.url)))
      .catch(() => this.message.error(`IDEA.ATTACHMENTS.ERROR_OPENING_ATTACHMENT`))
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