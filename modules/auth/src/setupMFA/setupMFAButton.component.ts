import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ModalController, IonButton } from '@ionic/angular/standalone';
import { IDEATranslatePipe } from '@idea-ionic/common';

import { IDEASetupMFAModalComponent } from './setupMFAModal.component';
import { IDEAAuthService } from '../auth.service';

@Component({
  selector: 'idea-setup-mfa-button',
  standalone: true,
  imports: [CommonModule, IDEATranslatePipe, IonButton],
  template: `
    @if (isMFAEnabled !== undefined) {
      <ion-button [color]="color" [fill]="fill" (click)="openMFAModal()">
        {{ (isMFAEnabled ? 'IDEA_AUTH.DISABLE_MFA' : 'IDEA_AUTH.SETUP_MFA') | translate }}
      </ion-button>
    }
  `
})
export class IDEASetupMFAButtonComponent implements OnInit {
  private _modal = inject(ModalController);
  private _auth = inject(IDEAAuthService);

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

  async ngOnInit(): Promise<void> {
    this.isMFAEnabled = await this._auth.checkIfUserHasMFAEnabled(true);
  }

  async openMFAModal(): Promise<void> {
    const modal = await this._modal.create({ component: IDEASetupMFAModalComponent, backdropDismiss: false });
    modal.onDidDismiss().then(({ data }): void => {
      if (data) {
        this.isMFAEnabled = data.enabled;
        this.change.emit(data.enabled);
      }
    });
    await modal.present();
  }
}
