import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RCConfiguredFolder, RCFolder, Suggestion } from 'idea-toolbox';
import { IDEAAWSAPIService, IDEATinCanService, IDEATranslationsService } from '@idea-ionic/common';

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
  @Input() public folder: RCConfiguredFolder;
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
  public folders: RCFolder[];
  /**
   * The folders mapped into suggestions.
   */
  public foldersSuggestions: Suggestion[];

  constructor(public t: IDEATranslationsService, public tc: IDEATinCanService, public API: IDEAAWSAPIService) {}

  /**
   * Load the resources from the resource center.
   */
  public ngOnInit() {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this.tc.get('membership').teamId || this.tc.get('teamId');
    // load the Resource Center folders
    this.API.getResource(`teams/${this.team}/folders`)
      .then((folders: RCFolder[]) => {
        this.folders = folders;
        this.foldersSuggestions = folders.map(x => new Suggestion({ value: x.folderId, name: x.name }));
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
