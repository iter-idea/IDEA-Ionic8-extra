import { Component, Input, Output, EventEmitter } from '@angular/core';
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

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
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * Regulate the mode (view/edit).
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();
  /**
   * The folders loaded from the resource center.
   */
  public folders: Array<IdeaX.RCFolder>;
  /**
   * The folders mapped into suggestions.
   */
  public foldersSuggestions: Array<IdeaX.Suggestion>;

  constructor(public t: IDEATranslationsService, public tc: IDEATinCanService, public API: IDEAAWSAPIService) {}

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
