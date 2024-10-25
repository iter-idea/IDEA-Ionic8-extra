import { CommonModule } from '@angular/common';
import { ViewChild, Component, Input, OnInit, inject } from '@angular/core';
import {
  IonInfiniteScroll,
  AlertController,
  ModalController,
  IonRefresher,
  IonSearchbar,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresherContent,
  IonList,
  IonCard,
  IonCardContent,
  IonListHeader,
  IonLabel,
  IonItem,
  IonSkeletonText,
  IonNote,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { loopStringEnumValues, RCFolder, RCResource, RCResourceFormats } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAMessageService,
  IDEATranslationsService,
  IDEAActionSheetController,
  IDEATranslatePipe,
  IDEALocalizedDatePipe
} from '@idea-ionic/common';
import { CacheModes, IDEAAWSAPIService, IDEAOfflineService, IDEATinCanService } from '@idea-ionic/uncommon';

const FILE_SIZE_LIMIT_MB = 10;

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-rc-resources',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IDEALocalizedDatePipe,
    IonSearchbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonNote,
    IonSkeletonText,
    IonItem,
    IonLabel,
    IonListHeader,
    IonCardContent,
    IonCard,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon name="arrow-back" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-searchbar
          #searchbar
          [placeholder]="
            'IDEA_TEAMS.RESOURCE_CENTER.SEARCH_FOR_RESOURCES_OF_FOLDER_' | translate: { folder: folder.name }
          "
          (ionInput)="search($event.target ? $event.target.value : '')"
        />
        <ion-buttons slot="end">
          @if (admin) {
            <ion-button
              [disabled]="_offline.isOffline()"
              [title]="'IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_NEW_RESOURCES' | translate"
              (click)="browseUploadNewResource()"
            >
              <ion-icon slot="icon-only" name="cloud-upload" />
            </ion-button>
          }
          <input
            id="newResourcePicker"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            style="display: none"
            (change)="uploadNewResources($event)"
          />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event.target)">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list class="aList">
        @if (uploadErrors?.length) {
          <ion-card color="danger">
            <ion-card-content>
              <b>{{ 'IDEA_TEAMS.RESOURCE_CENTER.THE_FOLLOWING_FILES_FAILED_UPLOAD' | translate }}:</b>
              <ul>
                @for (err of uploadErrors; track err) {
                  <li>{{ err }}</li>
                }
              </ul>
            </ion-card-content>
          </ion-card>
        }
        <ion-list-header>
          <ion-label>
            <h2>{{ folder.name }}</h2>
          </ion-label>
        </ion-list-header>
        @if (!filteredResources) {
          <ion-item>
            <ion-label>
              <ion-skeleton-text animated style="width: 50%" />
            </ion-label>
          </ion-item>
        }
        @if (filteredResources && !filteredResources.length) {
          <ion-item class="noElements">
            <ion-label>{{ 'COMMON.NO_ELEMENT_FOUND' | translate }}</ion-label>
          </ion-item>
        }
        @for (r of filteredResources; track r) {
          <ion-item>
            <ion-button
              slot="start"
              fill="clear"
              [title]="'IDEA_TEAMS.RESOURCE_CENTER.OPEN_RESOURCE' | translate"
              [disabled]="_offline.isOffline()"
              (click)="openResource(r)"
            >
              <ion-icon name="open-outline" slot="icon-only" />
            </ion-button>
            <ion-icon slot="start" color="medium" [name]="getFormatIcon(r.format)" [title]="r.format" />
            <ion-label>
              {{ r.name }}
              <p>
                {{ 'IDEA_TEAMS.RESOURCE_CENTER.LASTLY_UPDATED_X_AGO' | translate: { time: (r.version | dateLocale) } }}
              </p>
            </ion-label>
            <ion-note slot="end">{{ r.format }}</ion-note>
            @if (admin) {
              <ion-button
                color="medium"
                fill="clear"
                slot="end"
                [title]="'IDEA_TEAMS.RESOURCE_CENTER.ACTIONS_ON_THE_RESOURCE' | translate"
                [disabled]="_offline.isOffline()"
                (click)="actionsOnResource(r)"
              >
                <ion-icon name="ellipsis-vertical" slot="icon-only" />
              </ion-button>
            }
            <input
              [id]="r.resourceId.concat('_picker')"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style="display: none"
              (change)="updateResource(r, $event)"
            />
          </ion-item>
        }
        <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
          <ion-infinite-scroll-content />
        </ion-infinite-scroll>
      </ion-list>
    </ion-content>
  `
})
export class IDEARCResourcesComponent implements OnInit {
  private _tc = inject(IDEATinCanService);
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _actions = inject(IDEAActionSheetController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);
  private _API = inject(IDEAAWSAPIService);
  _offline = inject(IDEAOfflineService);

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

  ngOnInit(): void {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.teamId = this.teamId || this._tc.get('membership').teamId || this._tc.get('teamId');
    this.loadResources();
  }

  async loadResources(getFromNetwork?: boolean): Promise<void> {
    try {
      const useCache = getFromNetwork ? CacheModes.NETWORK_FIRST : CacheModes.CACHE_FIRST;
      const resources: RCResource[] = await this._API.getResource(
        `teams/${this.teamId}/folders/${this.folder.folderId}/resources`,
        { useCache }
      );
      this.resources = resources.map(r => new RCResource(r));
      this.search(this.searchbar ? this.searchbar.value : null);
    } catch (error) {
      this._message.error('IDEA_TEAMS.RESOURCE_CENTER.COULDNT_LOAD_LIST');
    }
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredResources = (this.resources || [])
      .filter(m =>
        toSearch
          .split(' ')
          .every(searchTerm => [m.name, m.format].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b): number => a.name.localeCompare(b.name));

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredResources = this.filteredResources.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }
  doRefresh(refresher?: IonRefresher): void {
    this.filteredResources = null;
    setTimeout((): void => {
      this.loadResources(Boolean(refresher));
      if (refresher) refresher.complete();
    }, 500); // the timeout is needed
  }

  async openResource(resource: RCResource): Promise<void> {
    try {
      await this._loading.show();
      const request = `teams/${this.teamId}/folders/${this.folder.folderId}/resources`;
      const body = { action: 'GET_DOWNLOAD_URL' };
      const { url } = await this._API.patchResource(request, { resourceId: resource.resourceId, body });
      Browser.open({ url });
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
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

  async actionsOnResource(res: RCResource): Promise<void> {
    if (!this.admin) return;
    const header = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.ACTIONS_ON_RESOURCE');
    const buttons = [];
    buttons.push({
      text: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_NEW_VERSION'),
      icon: 'cloud-upload',
      handler: (): void => this.browseUpdateResource(res)
    });
    buttons.push({
      text: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.RENAME'),
      icon: 'text',
      handler: (): Promise<void> => this.renameResource(res)
    });
    buttons.push({
      text: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.DELETE'),
      role: 'destructive',
      icon: 'trash',
      handler: (): Promise<void> => this.deleteResource(res)
    });
    buttons.push({ text: this._translate._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    const actions = await this._actions.create({ header, buttons });
    actions.present();
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
    await this._loading.show();
    await this.uploadFile(file);
    this._loading.hide();
    if (this.uploadErrors.length) this._message.error('IDEA_TEAMS.RESOURCE_CENTER.ONE_OR_MORE_FILE_UPLOAD_FAILED');
    else this._message.success('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_COMPLETED');
  }
  async renameResource(res: RCResource): Promise<void> {
    const doRename = async ({ name }: any): Promise<void> => {
      if (!name) return;
      if (this.resources.some(x => x.resourceId !== res.resourceId && x.name === name))
        return this._message.error('IDEA_TEAMS.RESOURCE_CENTER.RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS');
      res.name = name;
      try {
        await this._loading.show();
        const path = `teams/${this.teamId}/folders/${this.folder.folderId}/resources`;
        await this._API.putResource(path, { resourceId: res.resourceId, body: res });
        // full-refresh to be sure we update the cache
        this.loadResources(true);
      } catch (err) {
        if ((err as any).message === 'RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS')
          this._message.error('IDEA_TEAMS.RESOURCE_CENTER.RESOURCE_WITH_SAME_NAME_ALREADY_EXISTS');
        else this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.RENAME_RESOURCE');
    const subHeader = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_RESOURCE_NAME');
    const message = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_FOLDER');
    const inputs: any[] = [
      { name: 'name', placeholder: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME'), value: res.name }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doRename }
    ];
    const alert = await this._alert.create({ header, subHeader, message, inputs, buttons });
    alert.present();
  }
  async deleteResource(res: RCResource): Promise<void> {
    const doDelete = async (): Promise<void> => {
      try {
        await this._loading.show();
        const path = `teams/${this.teamId}/folders/${this.folder.folderId}/resources`;
        await this._API.deleteResource(path, { resourceId: res.resourceId });
        // full-refresh to be sure we update the cache
        this.loadResources(true);
      } catch (error) {
        this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const subHeader = this._translate._('COMMON.OPERATION_IRREVERSIBLE');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.DELETE'), handler: doDelete }
    ];
    const alert = await this._alert.create({ header, subHeader, buttons });
    alert.present();
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
    await this._loading.show();
    files.forEach(async file => await this.uploadFile(file));
    this._loading.hide();
    if (this.uploadErrors.length) this._message.error('IDEA_TEAMS.RESOURCE_CENTER.ONE_OR_MORE_FILE_UPLOAD_FAILED');
    else this._message.success('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_COMPLETED');
    // reload the resources (force update cache)
    this.loadResources(true);
  }

  async uploadFile(file: File, existingRes?: RCResource): Promise<void> {
    const fullName = file.name.split('.');
    const format = fullName.pop();
    const name = fullName.join('.');
    let resource: RCResource;
    if (existingRes) {
      existingRes.format = format as RCResourceFormats;
      resource = existingRes;
    } else resource = new RCResource({ name, format });

    if (!loopStringEnumValues(RCResourceFormats).some(x => x === format)) {
      this.uploadErrors.push(this._translate._('IDEA_TEAMS.RESOURCE_CENTER.INVALID_FORMAT_FILE_', { name }));
      return;
    }

    const sizeMB = Number((file.size / 1024 / 1024).toFixed(4));
    if (sizeMB > FILE_SIZE_LIMIT_MB) {
      this.uploadErrors.push(this._translate._('IDEA_TEAMS.RESOURCE_CENTER.INVALID_SIZE_FILE_', { name }));
      return;
    }

    try {
      const path = `teams/${this.teamId}/folders/${this.folder.folderId}/resources`;
      let req: Promise<RCResource>;
      if (existingRes) req = this._API.putResource(path, { resourceId: resource.resourceId, body: resource });
      else req = this._API.postResource(path, { body: resource });
      const newRes: RCResource = await req;
      try {
        const { url } = await this._API.patchResource(path, {
          resourceId: newRes.resourceId,
          body: { action: 'GET_UPLOAD_URL' }
        });
        await this._API.rawRequest().put(url, file).toPromise();
      } catch (error) {
        this.uploadErrors.push(this._translate._('IDEA_TEAMS.RESOURCE_CENTER.UPLOAD_ERROR_FILE', { name }));
      }
    } catch (error) {
      this.uploadErrors.push(this._translate._('IDEA_TEAMS.RESOURCE_CENTER.ERROR_CREATING_RESOURCE_FILE', { name }));
    }
  }

  close(): void {
    this._modal.dismiss();
  }
}
