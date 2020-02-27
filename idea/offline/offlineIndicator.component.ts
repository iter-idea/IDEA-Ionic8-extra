import { Component, Input } from '@angular/core';
import { ModalController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineDataService } from './offlineData.service';

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
    public t: TranslateService
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
              header: this.t.instant('IDEA.OFFLINE.YOU_ARE_OFFLINE'),
              message: this.t.instant('IDEA.OFFLINE.FEATURES_REDUCED_CONTENTS_NOT_UP_TO_DATE'),
              buttons: [this.t.instant('COMMON.GOT_IT')]
            })
            .then(alert => alert.present());
      });
    } else if (this.offline.resourcesToCache.length || this.offline.useQueueAPIRequests)
      this.modalCtrl.create({ component: IDEAOfflineManagerComponent }).then(modal => modal.present());
  }
}
