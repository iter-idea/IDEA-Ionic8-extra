import { Component, Input } from '@angular/core';
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
  @Input() public vertical: string;
  /**
   * Horizontal position.
   */
  @Input() public horizontal: string;
  /**
   * Whether it is positionated on an edge.
   */
  @Input() public edge: boolean;

  constructor(
    public platform: Platform,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public offline: IDEAOfflineDataService,
    public t: IDEATranslationsService
  ) {
    this.vertical = 'bottom';
    this.horizontal = 'start';
    this.edge = false;
  }

  /**
   * Open the offline manager component.
   */
  public showStatus() {
    if (this.offline.isOffline()) {
      this.offline.check().then(isOnline => {
        if (!isOnline)
          this.alertCtrl
            .create({
              header: this.t._('IDEA.OFFLINE.YOU_ARE_OFFLINE'),
              message: this.t._('IDEA.OFFLINE.FEATURES_REDUCED_CONTENTS_NOT_UP_TO_DATE'),
              buttons: [this.t._('COMMON.GOT_IT')]
            })
            .then(alert => alert.present());
      });
    } else if (this.offline.resourcesToCache.length || this.offline.useQueueAPIRequests)
      this.modalCtrl.create({ component: IDEAOfflineManagerComponent }).then(modal => modal.present());
  }
}
