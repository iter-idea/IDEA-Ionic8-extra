import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Browser } from '@capacitor/browser';
import {
  RCAttachedResource,
  RCConfiguredFolder,
  RCResource,
  RCResourceFormats,
  SignedURL,
  Suggestion
} from 'idea-toolbox';
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
  @Input() public team: string;
  /**
   * The folder of which to load the resources.
   */
  @Input() public folder: RCConfiguredFolder;
  /**
   * The array in which we want to add/remove resources.
   */
  @Input() public attachedResources: RCAttachedResource[];
  /**
   * Regulate the mode (view/edit).
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;

  /**
   * The resources loaded from the resource center.
   */
  public resources: RCResource[];
  /**
   * The resources mapped into suggestions.
   */
  public resourcesSuggestions: Suggestion[];

  constructor(
    public t: IDEATranslationsService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public offline: IDEAOfflineService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService
  ) {
    this.team = null;
    this.folder = null;
    this.editMode = false;
    this.attachedResources = null;
    this.lines = 'none';
    this.resources = null;
    this.resourcesSuggestions = null;
  }

  /**
   * Load the resources from the resource center.
   */
  public ngOnChanges(changes: SimpleChanges) {
    // load the resources and prepare the suggestions
    if (changes['team'] || changes['folder']) {
      // if the team isn't specified, try to guess it in the usual IDEA's paths
      this.team = this.team || this.tc.get('membership').teamId || this.tc.get('teamId');
      // load the resources from the specified folder and map them into suggestions (for idea-select)
      this.API.getResource(`teams/${this.team}/folders/${this.folder.folderId}/resources`)
        .then((resources: RCResource[]) => {
          this.resources = resources;
          this.resourcesSuggestions = resources.map(
            x => new Suggestion({ value: x.resourceId, name: `${x.name}.${x.format}` })
          );
        })
        .catch(() => {});
    }
  }

  /**
   * Add a resource from the picker by its id, if it hasn't been added already.
   */
  public addResource(resourceId: string) {
    // find the resource
    const resource = this.resources.find(r => r.resourceId === resourceId);
    // add it to the array
    if (resource) this.attachedResources.push(new RCAttachedResource(resource));
  }

  /**
   * Remove a resource from the ones previously selected.
   */
  public removeResource(resource: RCAttachedResource) {
    this.attachedResources.splice(this.attachedResources.indexOf(resource), 1);
  }

  /**
   * Request the attached resource and open it.
   */
  public async openResource(resource: RCAttachedResource, latestVersion?: boolean) {
    if (!resource) return;
    const body: any = { action: 'GET_DOWNLOAD_URL' };
    if (!latestVersion) body.version = resource.version;
    await this.loading.show();
    this.API.patchResource(`teams/${this.team}/folders/${this.folder.folderId}/resources`, {
      resourceId: resource.resourceId,
      body
    })
      .then((res: SignedURL) => Browser.open({ url: res.url }))
      .catch(() => this.message.error('IDEA_TEAMS.RESOURCE_CENTER.ERROR_OPENING_RESOURCE'))
      .finally(() => this.loading.hide());
  }

  /**
   * Return the name of an icon representing the format.
   */
  public getFormatIcon(format: RCResourceFormats): string {
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

  /**
   * Return whether it's available a new version of the resource.
   */
  public isResourceNewerVersionAvailable(attachedResource: RCAttachedResource): boolean {
    const latestRes = this.resources.find(x => x.resourceId === attachedResource.resourceId);
    return latestRes && latestRes.version > attachedResource.version;
  }
}
