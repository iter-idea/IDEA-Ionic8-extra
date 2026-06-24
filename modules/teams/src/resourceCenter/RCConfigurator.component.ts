import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  output,
  input
} from '@angular/core';
import { RCConfiguredFolder, RCFolder, Suggestion } from 'idea-toolbox';
import { IDEAMessageService, IDEASelectComponent, IDEATranslatePipe } from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEATinCanService } from '@idea-ionic/uncommon';

@Component({
  selector: 'idea-rc-configurator',
  imports: [IDEATranslatePipe, IDEASelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-select
      [data]="foldersSuggestions"
      [description]="folder()?.name || 'IDEA_TEAMS.RESOURCE_CENTER.NO_FOLDER_SELECTED' | translate"
      [label]="label()"
      [placeholder]="'IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER' | translate"
      [searchPlaceholder]="'IDEA_TEAMS.RESOURCE_CENTER.SELECT_FOLDER' | translate"
      [lines]="lines()"
      [hideIdFromUI]="true"
      [disabled]="!editMode()"
      [avoidAutoSelection]="true"
      [icon]="icon()"
      [iconColor]="iconColor()"
      (select)="$event ? setFolder($event?.value) : null"
      (iconSelect)="iconSelect.emit()"
    />
  `
})
export class IDEARCConfiguratorComponent implements OnInit {
  private _message = inject(IDEAMessageService);
  private _tc = inject(IDEATinCanService);
  private _API = inject(IDEAAWSAPIService);
  private _cdr = inject(ChangeDetectorRef);

  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() team: string;
  /**
   * The folder we want to configure with the Resource Center folder.
   */
  readonly folder = input<RCConfiguredFolder>();
  /**
   * The label for the field.
   */
  readonly label = input<string>();
  /**
   * Regulate the mode (view/edit).
   */
  readonly editMode = input<boolean>();
  /**
   * The lines attribute of the item.
   */
  readonly lines = input<string>();
  /**
   * The icon for the field.
   */
  readonly icon = input<string>();
  /**
   * The color of the icon.
   */
  readonly iconColor = input<string>();
  /**
   * Icon select.
   */
  readonly iconSelect = output<void>();

  folders: RCFolder[];
  foldersSuggestions: Suggestion[];

  async ngOnInit(): Promise<void> {
    // if the team isn't specified, try to guess it in the usual IDEA's paths
    this.team = this.team || this._tc.get('membership').teamId || this._tc.get('teamId');
    try {
      const folders: RCFolder[] = await this._API.getResource(`teams/${this.team}/folders`);
      this.folders = folders;
      this.foldersSuggestions = folders.map(x => new Suggestion({ value: x.folderId, name: x.name }));
      this._cdr.markForCheck();
    } catch (error) {
      this._message.error('COMMON.COULDNT_LOAD_LIST');
    }
  }

  setFolder(folderId?: string): void {
    const found = this.folders.find(f => f.folderId === folderId);
    const folder = this.folder();
    if (found) {
      folder.folderId = folderId;
      folder.name = found.name;
    } else {
      folder.folderId = null;
      folder.name = null;
    }
  }
}
