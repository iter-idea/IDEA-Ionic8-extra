import { ViewChild, Component, Input, OnInit } from '@angular/core';
import { IonInfiniteScroll, AlertController, ModalController, IonRefresher, IonSearchbar } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { loopStringEnumValues, RCFolder, RCResource, RCResourceFormats, SignedURL } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  CacheModes,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService,
  IDEAOfflineService,
  IDEAActionSheetController
} from '@idea-ionic/common';

const FILE_SIZE_LIMIT_MB = 10;

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-rc-resources',
  templateUrl: 'RCResources.component.html',
  styleUrls: ['RCResources.component.scss']
})
export class IDEARCResourcesComponent implements OnInit {
  /**
   * The id of the team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() teamId: string;
  /**
   * The Resource Center's folder of which to show the resources.
   */
  @Input() folder: RCFolder;
  /**
   * Whether the user has permissions to manage the resource center.
   */
  @Input() admin: boolean;

  resources: RCResource[];
  filteredResources: RCResource[];
  currentPage: number;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  uploadErrors: string[];

  constructor(
    private tc: IDEATinCanService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: IDEAActionSheetController,
    private loading: IDEALoadingService,
    private message: IDEAMessageService,
    private API: IDEAAWSAPIService,
    public offline: IDEAOfflineService,
    public t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.teamId = this.teamId || this.tc.get('membership').teamId || this.tc.get('teamId');
    this.loadResources();
  }

  loadResources(getFromNetwork?: boolean): void {
    this.API.getResource(`teams/${this.teamId}/folders/${this.folder.folderId}/resources`, {
      useCache: getFromNetwork ? CacheModes.NETWORK_FIRST : CacheModes.CACHE_FIRST
    })
      .then((resources: RCResource[]) => {
        this.resources = resources.map(r => new RCResource(r));
        this.search(this.searchbar ? this.searchbar.value : null);
      })
      .catch(() => this.message.error('IDEA_TEAMS.RESOURCE_CENTER.COULDNT_LOAD_LIST'));
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredResources = (this.resources || [])
      .filter(m =>
        toSearch
          .split(' ')
          .every(searchTerm => [m.name, m.format].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredResources = this.filteredResources.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }
  doRefresh(refresher?: IonRefresher): void {
    this.filteredResources = null;
    setTimeout(() => {
      this.loadResources(Boolean(refresher));
      if (refresher) refresher.complete();
    }, 500); // the timeout is needed
  }

  async openResource(resource: RCResource): Promise<void> {
    // get a (signed) URL to the resource and opens it in an external browser
    await this.loading.show();
    this.API.patchResource(`teams/${this.teamId}/folders/${this.folder.folderId}/resources`, {
      resourceId: resource.resourceId,
      body: { action: 'GET_DOWNLOAD_URL' }
    })
      .then((res: SignedURL) => Browser.open({ url: res.url }))
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  getFormatIcon(format: RCResourceFormats): string {
    switch (format) {
      case RCResourceFormats.JPG:
      case RCResourceFormats.JPEG:
      case RCResourceFormats.PNG:
        return 'image';
      case RCResourceFormats.PDF:
        return 'document';
      default:
        return 'help';
    }
  }

  actionsOnResource(res: RCResource): void {
    if (!this.admin) return;
    const buttons = [];
    buttons.push({
      text: this.t._('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_NEW_VERSION'),
      icon: 'cloud-upload',
      handler: () => this.browseUpdateResource(res)
    });
    buttons.push({
      text: this.t._('IDEA_TEAMS.RESOURCE_CENTER.RENAME'),
      icon: 'text',
      handler: () => this.renameResource(res)
    });
    buttons.push({
      text: this.t._('IDEA_TEAMS.RESOURCE_CENTER.DELETE'),
      role: 'destructive',
      icon: 'trash',
      handler: () => this.deleteResource(res)
    });
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_TEAMS.RESOURCE_CENTER.ACTIONS_ON_RESOURCE'), buttons })
      .then(actions => actions.present());
  }
  browseUpdateResource(res: RCResource): void {
    if (!this.admin) return;
    document.getElementById(res.resourceId.concat('_picker')).click();
  }
  async updateResource(res: RCResource, ev: any): Promise<void> {
    this.uploadErrors = new Array<string>();
    // identify the file to upload (consider only the first file selected)
    const fileList: FileList = ev.target ? ev.target.files : {};
    const file = fileList.item(0);
    // upload the file
    await this.loading.show();
    this.uploadFile(file).then(() => {
      this.loading.hide();
      if (this.uploadErrors.length) this.message.error('IDEA_TEAMS.RESOURCE_CENTER.ONE_OR_MORE_FILE_UPLOAD_FAILED');
      else this.message.success('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_COMPLETED');
    });
  }
  renameResource(res: RCResource): void {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_TEAMS.RESOURCE_CENTER.RENAME_RESOURCE'),
        subHeader: this.t._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_RESOURCE_NAME'),
        message: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_FOLDER'),
        inputs: [{ name: 'name', placeholder: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME'), value: res.name }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: data => {
              if (!data.name) return;
              // check for name uniqueness (front-end check)
              if (this.resources.some(x => x.resourceId !== res.resourceId && x.name === data.name))
                return this.message.error('IDEA_TEAMS.RESOURCE_CENTER.RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS');
              // set the new name
              res.name = data.name;
              this.loading.show();
              this.API.putResource(`teams/${this.teamId}/folders/${this.folder.folderId}/resources`, {
                resourceId: res.resourceId,
                body: res
              })
                // full-refresh to be sure we update the cache
                .then(() => this.loadResources(true))
                .catch(err => {
                  if (err.message === 'RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS')
                    this.message.error('IDEA_TEAMS.RESOURCE_CENTER.RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS');
                  else this.message.error('COMMON.OPERATION_FAILED');
                })
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
  deleteResource(res: RCResource): void {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        subHeader: this.t._('COMMON.OPERATION_IRREVERSIBLE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
            handler: () => {
              // delete the resource and update the list
              this.loading.show();
              this.API.deleteResource(`teams/${this.teamId}/folders/${this.folder.folderId}/resources`, {
                resourceId: res.resourceId
              })
                // full-refresh to be sure we update the cache
                .then(() => this.loadResources(true))
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  browseUploadNewResource(): void {
    if (!this.admin) return;
    // browse the local file(s)
    document.getElementById('newResourcePicker').click();
  }
  async uploadNewResources(ev: any): Promise<void> {
    this.uploadErrors = new Array<string>();
    // gather the files to upload
    const fileList: FileList = ev.target ? ev.target.files : {};
    const files = new Array<File>();
    for (let i = 0; i < fileList.length; i++) files.push(fileList.item(i));
    // upload each file and show the results
    await this.loading.show();
    files.forEach(async file => await this.uploadFile(file));
    this.loading.hide();
    if (this.uploadErrors.length) this.message.error('IDEA_TEAMS.RESOURCE_CENTER.ONE_OR_MORE_FILE_UPLOAD_FAILED');
    else this.message.success('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_COMPLETED');
    // reload the resources (force update cache)
    this.loadResources(true);
  }

  uploadFile(file: File, existingRes?: RCResource): Promise<void> {
    return new Promise(resolve => {
      // prepare the resource metadata
      const fullName = file.name.split('.');
      const format = fullName.pop();
      const name = fullName.join('.');
      let resource: RCResource;
      if (existingRes) {
        existingRes.format = format as RCResourceFormats;
        resource = existingRes;
      } else resource = new RCResource({ name, format });
      // check the file format
      if (!loopStringEnumValues(RCResourceFormats).some(x => x === format)) {
        this.uploadErrors.push(this.t._('IDEA_TEAMS.RESOURCE_CENTER.INVALID_FORMAT_FILE_', { name }));
        return resolve();
      }
      // check the file size
      const sizeMB = Number((file.size / 1024 / 1024).toFixed(4));
      if (sizeMB > FILE_SIZE_LIMIT_MB) {
        this.uploadErrors.push(this.t._('IDEA_TEAMS.RESOURCE_CENTER.INVALID_SIZE_FILE_', { name }));
        return resolve();
      }
      // identify the action (POST/PUT)
      const url = `teams/${this.teamId}/folders/${this.folder.folderId}/resources`;
      let req: Promise<RCResource>;
      if (existingRes) req = this.API.putResource(url, { resourceId: resource.resourceId, body: resource });
      else req = this.API.postResource(url, { body: resource });
      // execute the request
      req
        .then((newRes: RCResource) => {
          // request a URL to upload the file for the resource
          this.API.patchResource(`teams/${this.teamId}/folders/${this.folder.folderId}/resources`, {
            resourceId: newRes.resourceId,
            body: { action: 'GET_UPLOAD_URL' }
          })
            .then((signedURL: SignedURL) => {
              // upload the file
              this.API.rawRequest()
                .put(signedURL.url, file)
                .toPromise()
                .finally(() => resolve())
                .catch(() =>
                  this.uploadErrors.push(this.t._('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_ERROR_FILE', { name }))
                );
            })
            .catch(() => {
              this.uploadErrors.push(this.t._('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_ERROR_FILE', { name }));
              resolve();
            });
        })
        .catch(() => {
          this.uploadErrors.push(this.t._('IDEA_TEAMS.RESOURCE_CENTER.ERROR_CREATING_RESOURCE_FILE', { name }));
          resolve();
        });
    });
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}
