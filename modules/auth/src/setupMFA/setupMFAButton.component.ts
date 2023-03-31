import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { IDEASetupMFAModalComponent } from './setupMFAModal.component';

import { IDEAAuthService } from '../auth.service';

@Component({
  selector: 'idea-setup-mfa-button',
  templateUrl: 'setupMFAButton.component.html',
  styleUrls: ['setupMFAButton.component.scss']
})
export class IDEASetupMFAButtonComponent implements OnInit {
  /**
   * The color of the button.
   */
  @Input() color: string;
  /**
   * The fill option for the button.
   */
  @Input() fill: string;
  /**
   * Trigger then the MFA setup changes.
   */
  @Output() change = new EventEmitter<boolean>();

  isMFAEnabled: boolean;

  constructor(private modalCtrl: ModalController, private auth: IDEAAuthService) {}
  async ngOnInit(): Promise<void> {
    this.isMFAEnabled = await this.auth.checkIfUserHasMFAEnabled(true);
  }

  async openMFAModal(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: IDEASetupMFAModalComponent, backdropDismiss: false });
    modal.onDidDismiss().then(({ data }): void => {
      if (data) {
        this.isMFAEnabled = data.enabled;
        this.change.emit(data.enabled);
      }
    });
    await modal.present();
  }
}
