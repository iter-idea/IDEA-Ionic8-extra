import { Component, Input } from '@angular/core';
import { AlertController, ModalController, IonRefresher, IonSearchbar } from '@ionic/angular';

import {
  IDEALoadingService,
  IDEAAWSAPIService,
  CacheModes,
  IDEATinCanService,
  IDEATranslationsService,
  IDEAMessageService,
  IDEAOfflineService
} from '@idea-ionic/common';
import { RCFolder } from 'idea-toolbox';

import { IDEARCResourcesComponent } from './RCResources.component';

@Component({
  selector: 'idea-rc-folders',
  templateUrl: 'RCFolders.component.html',
  styleUrls: ['RCFolders.component.scss']
})
export class IDEARCFoldersComponent {
  /**
   * The id of the team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() public teamId: string;
  /**
   * Whether the user has permissions to manage the resource center.
   */
  @Input() public admin: boolean;
  /**
   * The folders available to the team.
   */
  public folders: RCFolder[];
  /**
   * The folders filtered based on the current search.
   */
  public filteredFolders: RCFolder[];
  /**
   * The searchbar to locally filter the list.
   */
  public searchbar: IonSearchbar;

  constructor(
    public tc: IDEATinCanService,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public offline: IDEAOfflineService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.teamId = this.teamId || this.tc.get('membership').teamId || this.tc.get('teamId');
    // load the Resource Center folders of the team
    this.loadFolders();
  }

  /**
   * (re)Load the Resource Center folders of the team.
   */
  public loadFolders(getFromNetwork?: boolean) {
    this.API.getResource(`teams/${this.teamId}/folders`, {
      useCache: getFromNetwork ? CacheModes.NETWORK_FIRST : CacheModes.CACHE_FIRST
    })
      .then((folders: RCFolder[]) => {
        this.folders = folders.map(f => new RCFolder(f));
        this.search(this.searchbar ? this.searchbar.value : null);
      })
      .catch(() => this.message.error('IDEA_TEAMS.RESOURCE_CENTER.COULDNT_LOAD_LIST'));
  }

  /**
   * Search within the list by filtering on the main fields.
   */
  public search(toSearch?: string) {
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // filter based on the main fields of the models and paginate
    this.filteredFolders = (this.folders || [])
      .filter(m =>
        toSearch.split(' ').every(searchTerm => [m.name].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  /**
   * Refresh the list.
   */
  public doRefresh(refresher?: IonRefresher) {
    this.filteredFolders = null;
    setTimeout(() => {
      this.loadFolders(Boolean(refresher));
      if (refresher) refresher.complete();
    }, 500); // the timeout is needed
  }

  /**
   * Open a folder to see and manage its resources.
   */
  public openFolder(folder: RCFolder) {
    this.modalCtrl
      .create({ component: IDEARCResourcesComponent, componentProps: { folder, admin: this.admin } })
      .then(modal => modal.present());
  }
  /**
   * Create a new folder in the current resource center.
   */
  public newFolder() {
    if (!this.admin) return;
    // ask for the name of the new folder
    this.alertCtrl
      .create({
        header: this.t._('IDEA_TEAMS.RESOURCE_CENTER.CREATE_NEW_FOLDER'),
        subHeader: this.t._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER_NAME'),
        message: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_RC'),
        inputs: [{ name: 'name', placeholder: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME') }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: data => {
              if (!data.name) return;
              // check for name uniqueness (front-end check)
              if (this.folders.some(x => x.name === data.name))
                return this.message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
              // create a new folder and refresh the list
              this.loading.show();
              this.API.postResource(`teams/${this.teamId}/folders`, { body: { name: data.name } })
                // full-refresh to be sure we update the cache
                .then(() => this.loadFolders(true))
                .catch(err => {
                  if (err.message === 'FOLDER_WITH_SAME_NAME_ALREADY_EXISTS')
                    this.message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
                  else this.message.error('COMMON.OPERATION_FAILED');
                })
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Rename a folder.
   */
  public renameFolder(folder: RCFolder, event?: any) {
    if (event) event.stopPropagation();
    if (!this.admin) return;
    this.alertCtrl
      .create({
        header: this.t._('IDEA_TEAMS.RESOURCE_CENTER.RENAME_FOLDER'),
        subHeader: this.t._('IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER_NAME'),
        message: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME_MUST_BE_UNIQUE_IN_RC'),
        inputs: [{ name: 'name', placeholder: this.t._('IDEA_TEAMS.RESOURCE_CENTER.NAME'), value: folder.name }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: data => {
              if (!data.name) return;
              // check for name uniqueness (front-end check)
              if (this.folders.some(x => x.folderId !== folder.folderId && x.name === data.name))
                return this.message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
              // set the new name
              folder.name = data.name;
              this.loading.show();
              this.API.putResource(`teams/${this.teamId}/folders`, { resourceId: folder.folderId, body: folder })
                // full-refresh to be sure we update the cache
                .then(() => this.loadFolders(true))
                .catch(err => {
                  if (err.message === 'FOLDER_WITH_SAME_NAME_ALREADY_EXISTS')
                    this.message.error('IDEA_TEAMS.RESOURCE_CENTER.FOLDER_WITH_SAME_NAME_ALREADY_EXISTS');
                  else this.message.error('COMMON.OPERATION_FAILED');
                })
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Delete a folder.
   */
  public deleteFolder(folder: RCFolder, event?: any) {
    if (event) event.stopPropagation();
    if (!this.admin) return;
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        subHeader: this.t._('COMMON.OPERATION_IRREVERSIBLE'),
        message: this.t._('IDEA_TEAMS.RESOURCE_CENTER.YOU_WILL_USE_ALL_FILES_IN_FOLDER'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
            handler: () => {
              // delete the folder and its files and update the list
              this.loading.show();
              this.API.deleteResource(`teams/${this.teamId}/folders`, { resourceId: folder.folderId })
                // full-refresh to be sure we update the cache
                .then(() => this.loadFolders(true))
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
