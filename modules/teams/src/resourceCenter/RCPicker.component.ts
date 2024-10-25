import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Browser } from '@capacitor/browser';
import { IonItem, IonButton, IonIcon, IonInput, IonLabel, IonText } from '@ionic/angular/standalone';
import { RCAttachedResource, RCConfiguredFolder, RCResource, RCResourceFormats, Suggestion } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAMessageService,
  IDEASelectComponent,
  IDEATranslatePipe,
  IDEATranslationsService
} from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEAOfflineService, IDEATinCanService } from '@idea-ionic/uncommon';

@Component({
  selector: 'idea-rc-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEASelectComponent,
    IonText,
    IonLabel,
    IonInput,
    IonIcon,
    IonButton,
    IonItem
  ],
  template: `
    @for (r of attachedResources; track r; let odd = $odd) {
      <ion-item class="resources" [lines]="lines" [class.odd]="odd">
        @if (_offline.isOnline()) {
          <ion-button fill="clear" size="small" slot="start" (click)="openResource(r, true)">
            <ion-icon name="open-outline" slot="icon-only" size="small" />
          </ion-button>
        }
        @if (!editMode) {
          <ion-icon slot="start" color="medium" [name]="getFormatIcon(r.format)" [title]="r.format" />
        }
        @if (editMode) {
          <ion-input
            [(ngModel)]="r.name"
            [placeholder]="r.originalName"
            (ionBlur)="$event.target.value = $event.target.value || _translate._('IDEA_TEAMS.RESOURCE_CENTER.NO_NAME')"
          />
        }
        @if (!editMode) {
          <ion-label>
            {{ r.name }}
            <p>{{ r.originalName }}.{{ r.format }}</p>
            @if (resources && isResourceNewerVersionAvailable(r)) {
              <p class="ion-text-wrap oldVersionAlert">
                {{ 'IDEA_TEAMS.RESOURCE_CENTER.VERSION_ATTACHED_IS_OLDER' | translate }}.
                @if (_offline.isOnline()) {
                  <ion-text class="tappable" (click)="openResource(r)">
                    {{ 'IDEA_TEAMS.RESOURCE_CENTER.OPEN_OLD_VERSION' | translate }}
                  </ion-text>
                }
              </p>
            }
          </ion-label>
        }
        @if (editMode) {
          <ion-button
            slot="end"
            color="danger"
            fill="clear"
            [title]="'IDEA_TEAMS.RESOURCE_CENTER.REMOVE_RESOURCE' | translate"
            (click)="removeResource(r)"
          >
            <ion-icon name="remove" slot="icon-only" />
          </ion-button>
        }
      </ion-item>
    }
    <!----->
    @if (!editMode && !attachedResources?.length) {
      <ion-item lines="none" class="noResources">
        <ion-label>
          {{ 'IDEA_TEAMS.RESOURCE_CENTER.NO_RESOURCES' | translate }}
        </ion-label>
      </ion-item>
    }
    <!----->
    @if (editMode && resourcesSuggestions) {
      <idea-select
        [data]="resourcesSuggestions"
        [placeholder]="'IDEA_TEAMS.RESOURCE_CENTER.TAP_TO_ADD_A_RESOURCE' | translate"
        [searchPlaceholder]="'IDEA_TEAMS.RESOURCE_CENTER.RESOURCES_AVAILABLE' | translate"
        [lines]="'none'"
        [clearValueAfterSelection]="true"
        [hideClearButton]="true"
        [avoidAutoSelection]="true"
        [hideIdFromUI]="true"
        (select)="$event ? addResource($event.value) : null"
      />
    }
  `,
  styles: [
    `
      .resources {
        ion-button[slot='start'],
        ion-icon[slot='start'] {
          margin-right: 10px;
        }
        .oldVersionAlert {
          font-size: 0.8em;
          line-height: 1em;
          font-style: italic;
          ion-text {
            color: var(--ion-color-primary);
            font-weight: 500;
          }
        }
      }
      .noResources {
        font-style: italic;
      }
      .tappable {
        cursor: pointer;
      }
    `
  ]
})
export class IDEARCPickerComponent implements OnChanges {
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _tc = inject(IDEATinCanService);
  private _API = inject(IDEAAWSAPIService);
  _offline = inject(IDEAOfflineService);
  _translate = inject(IDEATranslationsService);

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

  getFormatIcon(format: RCResourceFormats | string): string {
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
