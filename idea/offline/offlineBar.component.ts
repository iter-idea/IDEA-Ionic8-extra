import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { IDEAOfflineService } from './offline.service';
import { IDEAOfflineManagerComponent } from './offlineManager.component';

@Component({
  selector: 'idea-offline-bar',
  templateUrl: 'offlineBar.component.html',
  styleUrls: ['offlineBar.component.scss']
})
export class IDEAOfflineBarComponent {
  /**
   * The offset, in pixel, from the bottom of the page (in case of footer or tab-bar).
   */
  @Input() public offsetBottom: boolean;

  constructor(public modalCtrl: ModalController, public offline: IDEAOfflineService) {}

  /**
   * Open the offline manager component.
   */
  public openOfflineManager() {
    this.modalCtrl.create({ component: IDEAOfflineManagerComponent }).then(modal => modal.present());
  }
}
