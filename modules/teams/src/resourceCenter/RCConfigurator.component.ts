import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { RCConfiguredFolder, RCFolder, Suggestion } from 'idea-toolbox';
import { IDEAMessageService, IDEASelectComponent, IDEATranslatePipe } from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEATinCanService } from '@idea-ionic/uncommon';

@Component({
  selector: 'idea-rc-configurator',
  imports: [CommonModule, IDEATranslatePipe, IDEASelectComponent],
  template: `
    <idea-select
      [data]="foldersSuggestions"
      [description]="folder?.name || 'IDEA_TEAMS.RESOURCE_CENTER.NO_FOLDER_SELECTED' | translate"
      [label]="label"
      [placeholder]="'IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER' | translate"
      [searchPlaceholder]="'IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER' | translate"
      [lines]="lines"
      [hideIdFromUI]="true"
      [disabled]="!editMode"
      [avoidAutoSelection]="true"
      [icon]="icon"
      [iconColor]="iconColor"
      (select)="$event ? setFolder($event?.value) : null"
      (iconSelect)="iconSelect.emit()"
    />
  `
})
export class IDEARCConfiguratorComponent implements OnInit {
  private _message = inject(IDEAMessageService);
  private _tc = inject(IDEATinCanService);
  private _API = inject(IDEAAWSAPIService);

  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() team: string;
  /**
   * The folder we want to configure with the Resource Center folder.
   */
  @Input() folder: RCConfiguredFolder;
  /**
   * The label for the field.
   */
  @Input() label: string;
  /**
   * Regulate the mode (view/edit).
   */
  @Input() editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();

  folders: RCFolder[];
  foldersSuggestions: Suggestion[];

  async ngOnInit(): Promise<void> {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this._tc.get('membership').teamId || this._tc.get('teamId');
    try {
      const folders: RCFolder[] = await this._API.getResource(`teams/${this.team}/folders`);
      this.folders = folders;
      this.foldersSuggestions = folders.map(x => new Suggestion({ value: x.folderId, name: x.name }));
    } catch (error) {
      this._message.error('COMMON.COULDNT_LOAD_LIST');
    }
  }

  setFolder(folderId?: string): void {
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
