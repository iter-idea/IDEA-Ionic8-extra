import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';

@Component({
  selector: 'idea-rc-configurator',
  templateUrl: 'RCConfigurator.component.html',
  styleUrls: ['RCConfigurator.component.scss']
})
export class IDEARCConfiguratorComponent {
  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() public team: string;
  /**
   * The folder we want to configure with the Resource Center folder.
   */
  @Input() public folder: IdeaX.RCConfiguredFolder;
  /**
   * Regulate the mode (view/edit).
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;

  /**
   * The folders loaded from the resource center.
   */
  public folders: Array<IdeaX.RCFolder>;
  /**
   * The folders mapped into suggestions.
   */
  public foldersSuggestions: Array<IdeaX.Suggestion>;

  constructor(public t: TranslateService, public tc: IDEATinCanService, public API: IDEAAWSAPIService) {
    this.team = null;
    this.folder = null;
    this.editMode = false;
    this.lines = 'none';
    this.folders = null;
    this.foldersSuggestions = null;
  }

  /**
   * Load the resources from the resource center.
   */
  public ngOnInit() {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this.tc.get('membership').teamId || this.tc.get('teamId');
    // load the Resource Center folders
    this.API.getResource(`teams/${this.team}/folders`)
      .then((folders: Array<IdeaX.RCFolder>) => {
        this.folders = folders;
        this.foldersSuggestions = folders.map(x => new IdeaX.Suggestion({ value: x.folderId, name: x.name }));
      })
      .catch(() => {});
  }

  /**
   * Set/unset the folder.
   */
  public setFolder(folderId?: string) {
    const folder = this.folders.find(f => f.folderId === folderId);
    if (folder) {
      this.folder.folderId = folderId;
      this.folder.name = folder.name;
    } else {
      this.folder.folderId = null;
      this.folder.name = null;
    }
  }
}
