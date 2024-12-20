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
  IonItem,
  IonLabel,
  IonInfiniteScrollContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { RCFolder } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';
import { CacheModes, IDEAAWSAPIService, IDEAOfflineService, IDEATinCanService } from '@idea-ionic/uncommon';

import { IDEARCResourcesComponent } from './RCResources.component';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-rc-folders',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonLabel,
    IonItem,
    IonList,
    IonRefresher,
    IonRefresherContent,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonSearchbar
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
          [placeholder]="'IDEA_TEAMS.RESOURCE_CENTER.SEARCH_FOR_FOLDERS' | translate"
          (ionInput)="search($event.target ? $event.target.value : '')"
        />
        <ion-buttons slot="end">
          @if (admin) {
            <ion-button
              [disabled]="_offline.isOffline()"
              [title]="'IDEA_TEAMS.RESOURCE_CENTER.CREATE_NEW_FOLDER' | translate"
              (click)="newFolder()"
            >
              <ion-icon slot="icon-only" name="add" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event.target)">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list class="aList">
        @if (!filteredFolders) {
          <ion-item>
            <ion-label>
              <ion-skeleton-text animated style="width: 50%" />
            </ion-label>
          </ion-item>
        }
        @if (filteredFolders && !filteredFolders.length) {
          <ion-item class="noElements">
            <ion-label>{{ 'COMMON.NO_ELEMENT_FOUND' | translate }}</ion-label>
          </ion-item>
        }
        @for (folder of filteredFolders; track folder) {
          <ion-item button (click)="openFolder(folder)">
            <ion-label>{{ folder.name }}</ion-label>
            <ion-button
              color="medium"
              fill="clear"
              slot="end"
              [title]="'IDEA_TEAMS.RESOURCE_CENTER.RENAME' | translate"
              [disabled]="_offline.isOffline()"
              (click)="renameFolder(folder, $event)"
            >
              <ion-icon name="pencil" slot="icon-only" />
            </ion-button>
            <ion-button
              color="danger"
              fill="clear"
              slot="end"
              [title]="'IDEA_TEAMS.RESOURCE_CENTER.DELETE' | translate"
              [disabled]="_offline.isOffline()"
              (click)="deleteFolder(folder, $event)"
            >
              <ion-icon name="trash" slot="icon-only" />
            </ion-button>
          </ion-item>
        }
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `
})
export class IDEARCFoldersComponent implements OnInit {
  private _tc = inject(IDEATinCanService);
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
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
   * Whether the user has permissions to manage the resource center.
   */
  @Input() admin: boolean;

  folders: RCFolder[];
  filteredFolders: RCFolder[];
  currentPage: number;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  ngOnInit(): void {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.teamId = this.teamId || this._tc.get('membership').teamId || this._tc.get('teamId');
    this.loadFolders();
  }
  async loadFolders(getFromNetwork?: boolean): Promise<void> {
    try {
      const folders: RCFolder[] = await this._API.getResource(`teams/${this.teamId}/folders`, {
        useCache: getFromNetwork ? CacheModes.NETWORK_FIRST : CacheModes.CACHE_FIRST
      });
      this.folders = folders.map(f => new RCFolder(f));
      this.search(this.searchbar ? this.searchbar.value : null);
    } catch (error) {
      this._message.error('IDEA_TEAMS.RESOURCE_CENTER.COULDNT_LOAD_LIST');
    }
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredFolders = (this.folders || [])
      .filter(m =>
        toSearch.split(' ').every(searchTerm => [m.name].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b): number => a.name.localeCompare(b.name));

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredFolders = this.filteredFolders.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }
  doRefresh(refresher?: IonRefresher): void {
    this.filteredFolders = null;
    setTimeout((): void => {
      this.loadFolders(Boolean(refresher));
      if (refresher) refresher.complete();
    }, 500); // the timeout is needed
  }

  openFolder(folder: RCFolder): void {
    this._modal
      .create({ component: IDEARCResourcesComponent, componentProps: { folder, admin: this.admin } })
      .then(modal => modal.present());
  }
  async newFolder(): Promise<void> {
    if (!this.admin) return;

    const doCreate = async ({ name }: any): Promise<void> => {
      if (!name) return;
      if (this.folders.some(x => x.name === name))
        return this._message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
      try {
        await this._loading.show();
        await this._API.postResource(`teams/${this.teamId}/folders`, { body: { name: name } });
        // full-refresh to be sure we update the cache
        this.loadFolders(true);
      } catch (err: any) {
        if (err.message === 'FOLDER_WITH_SAME_NAME_ALREADY_EXISTS')
          this._message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
        else this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.CREATE_NEW_FOLDER');
    const subHeader = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER_NAME');
    const message = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_RC');
    const inputs: any[] = [{ name: 'name', placeholder: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME') }];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doCreate }
    ];
    const alert = await this._alert.create({ header, subHeader, message, inputs, buttons });
    alert.present();
  }

  async renameFolder(folder: RCFolder, event?: any): Promise<void> {
    if (event) event.stopPropagation();
    if (!this.admin) return;

    const doRemove = async ({ name }: any): Promise<void> => {
      if (!name) return;
      if (this.folders.some(x => x.folderId !== folder.folderId && x.name === name))
        return this._message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
      folder.name = name;
      try {
        await this._loading.show();
        await this._API.putResource(`teams/${this.teamId}/folders`, { resourceId: folder.folderId, body: folder });
        // full-refresh to be sure we update the cache
        this.loadFolders(true);
      } catch (err: any) {
        if (err.message === 'FOLDER_WITH_SAME_NAME_ALREADY_EXISTS')
          this._message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
        else this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.RENAME_FOLDER');
    const subHeader = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER_NAME');
    const message = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_RC');
    const inputs: any[] = [
      { name: 'name', placeholder: this._translate._('IDEA_TEAMS.RESOURCE_CENTER.NAME'), value: folder.name }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doRemove }
    ];
    const alert = await this._alert.create({ header, subHeader, message, inputs, buttons });
    alert.present();
  }
  async deleteFolder(folder: RCFolder, event?: any): Promise<void> {
    if (event) event.stopPropagation();
    if (!this.admin) return;

    const doDelete = async (): Promise<void> => {
      try {
        await this._loading.show();
        await this._API.deleteResource(`teams/${this.teamId}/folders`, { resourceId: folder.folderId });
        // full-refresh to be sure we update the cache
        this.loadFolders(true);
      } catch {
        this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const subHeader = this._translate._('COMMON.OPERATION_IRREVERSIBLE');
    const message = this._translate._('IDEA_TEAMS.RESOURCE_CENTER.YOU_WILL_USE_ALL_FILES_IN_FOLDER');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.DELETE'), handler: doDelete }
    ];
    const alert = await this._alert.create({ header, subHeader, message, buttons });
    alert.present();
  }

  close(): void {
    this._modal.dismiss();
  }
}
