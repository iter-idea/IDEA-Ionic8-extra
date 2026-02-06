import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ModalController, AlertController, Platform, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { IDEATranslationsService } from '@idea-ionic/common';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineDataService } from './offlineData.service';

@Component({
  selector: 'idea-offline-indicator',
  imports: [CommonModule, IonFab, IonFabButton, IonIcon],
  template: `
    @if (
      _platform.is('mobile') && (_offline.isOffline() || _offline.synchronizing || _offline.requiresManualConfirmation)
    ) {
      <ion-fab [vertical]="vertical" [horizontal]="horizontal" [edge]="edge">
        <ion-fab-button color="dark" size="small" (click)="showStatus()">
          <!-- OFFLINE -->
          @if (_offline.isOffline()) {
            <ion-icon name="airplane" />
          }
          <!-- SYNCHRONISING -->
          @if (_offline.isOnline() && _offline.synchronizing) {
            <ion-icon name="sync" />
          }
          <!-- NEED MANAL SYNCHRONISATION -->
          @if (_offline.isOnline() && _offline.requiresManualConfirmation) {
            <ion-icon name="pause" />
          }
        </ion-fab-button>
      </ion-fab>
    }
  `
})
export class IDEAOfflineIndicatorComponent {
  private _alert = inject(AlertController);
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);
  _platform = inject(Platform);
  _offline = inject(IDEAOfflineDataService);

  /**
   * Vertical position.
   */
  @Input() vertical = 'bottom';
  /**
   * Horizontal position.
   */
  @Input() horizontal = 'start';
  /**
   * Whether it is positionated on an edge.
   */
  @Input() edge = false;

  async showStatus(): Promise<void> {
    if (this._offline.isOffline()) {
      const isOnline = await this._offline.check();
      if (!isOnline) {
        const alert = await this._alert.create({
          header: this._translate._('IDEA_UNCOMMON.OFFLINE.YOU_ARE_OFFLINE'),
          message: this._translate._('IDEA_UNCOMMON.OFFLINE.FEATURES_REDUCED_CONTENTS_NOT_UP_TO_DATE'),
          buttons: [this._translate._('COMMON.GOT_IT')]
        });
        alert.present();
      }
    } else if (this._offline.isAllowed()) {
      const modal = await this._modal.create({ component: IDEAOfflineManagerComponent });
      modal.present();
    }
  }
}
