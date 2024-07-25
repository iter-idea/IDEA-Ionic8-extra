import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { RCAttachedResource, RCConfiguredFolder, RCResource, RCResourceFormats, Suggestion } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService,
  IDEAOfflineService
} from '@idea-ionic/common';

@Component({
  selector: 'idea-rc-picker',
  templateUrl: 'RCPicker.component.html',
  styleUrls: ['RCPicker.component.scss']
})
export class IDEARCPickerComponent implements OnChanges {
  /**
   * The team from which we want to load the resources. Default: try to guess current team.
   */
  @Input() team: string;
  /**
   * The folder of which to load the resources.
   */
  @Input() folder: RCConfiguredFolder;
  /**
   * The array in which we want to add/remove resources.
   */
  @Input() attachedResources: RCAttachedResource[];
  /**
   * Regulate the mode (view/edit).
   */
  @Input() editMode = false;
  /**
   * The lines attribute of the item.
   */
  @Input() lines = 'none';

  resources: RCResource[];
  resourcesSuggestions: Suggestion[];

  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _tc = inject(IDEATinCanService);
  private _API = inject(IDEAAWSAPIService);
  _offline = inject(IDEAOfflineService);
  _translate = inject(IDEATranslationsService);

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.team || changes.folder) {
      // if the team isn't specified, try to guess it in the usual IDEA's paths
      this.team = this.team || this._tc.get('membership').teamId || this._tc.get('teamId');
      try {
        const url = `teams/${this.team}/folders/${this.folder.folderId}/resources`;
        const resources: RCResource[] = await this._API.getResource(url);
        this.resources = resources;
        this.resourcesSuggestions = resources.map(
          x => new Suggestion({ value: x.resourceId, name: `${x.name}.${x.format}` })
        );
      } catch (error) {
        this._message.error('COMMON.COULDNT_LOAD_LIST');
      }
    }
  }

  addResource(resourceId: string): void {
    const resource = this.resources.find(r => r.resourceId === resourceId);
    if (resource) this.attachedResources.push(new RCAttachedResource(resource));
  }

  removeResource(resource: RCAttachedResource): void {
    this.attachedResources.splice(this.attachedResources.indexOf(resource), 1);
  }

  async openResource(resource: RCAttachedResource, latestVersion?: boolean): Promise<void> {
    if (!resource) return;
    const body: any = { action: 'GET_DOWNLOAD_URL' };
    if (!latestVersion) body.version = resource.version;
    try {
      await this._loading.show();
      const request = `teams/${this.team}/folders/${this.folder.folderId}/resources`;
      const { url } = await this._API.patchResource(request, { resourceId: resource.resourceId, body });
      await Browser.open({ url });
    } catch (error) {
      this._message.error('IDEA_TEAMS.RESOURCE_CENTER.ERROR_OPENING_RESOURCE');
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

  isResourceNewerVersionAvailable(attachedResource: RCAttachedResource): boolean {
    const latestRes = this.resources.find(x => x.resourceId === attachedResource.resourceId);
    return latestRes && latestRes.version > attachedResource.version;
  }
}
