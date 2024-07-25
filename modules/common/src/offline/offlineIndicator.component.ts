import { Component, Input, inject } from '@angular/core';
import { ModalController, AlertController, Platform } from '@ionic/angular';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineDataService } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-offline-indicator',
  templateUrl: 'offlineIndicator.component.html',
  styleUrls: ['offlineIndicator.component.scss']
})
export class IDEAOfflineIndicatorComponent {
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

  private _alert = inject(AlertController);
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);
  _platform = inject(Platform);
  _offline = inject(IDEAOfflineDataService);

  async showStatus(): Promise<void> {
    if (this._offline.isOffline()) {
      const isOnline = await this._offline.check();
      if (!isOnline) {
        const alert = await this._alert.create({
          header: this._translate._('IDEA_COMMON.OFFLINE.YOU_ARE_OFFLINE'),
          message: this._translate._('IDEA_COMMON.OFFLINE.FEATURES_REDUCED_CONTENTS_NOT_UP_TO_DATE'),
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
