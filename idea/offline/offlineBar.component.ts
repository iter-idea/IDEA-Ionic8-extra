import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { IDEAOfflineService } from './offline.service';
import { IDEAOfflineManagerComponent } from './offlineManager.component';

@Component({
  selector: 'IDEAOfflineBarComponent',
  templateUrl: 'offlineBar.component.html',
  styleUrls: ['offlineBar.component.scss']
})
export class IDEAOfflineBarComponent {
  @Input() public offsetBottom: boolean;

  constructor(public modalCtrl: ModalController, public offline: IDEAOfflineService) {}

  public openOfflineManager() {
    this.modalCtrl.create({ component: IDEAOfflineManagerComponent }).then(modal => modal.present());
  }
}
