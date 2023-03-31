import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { toCanvas } from 'qrcode';

import { IDEAAuthService } from '../auth.service';
import { IDEALoadingService, IDEAMessageService } from '@idea-ionic/common';

@Component({
  selector: 'idea-setup-mfa-modal',
  templateUrl: 'setupMFAModal.component.html',
  styleUrls: ['setupMFAModal.component.scss']
})
export class IDEASetupMFAModalComponent implements OnInit {
  otpCode: string;
  isMFAEnabled: boolean;

  constructor(
    private modalCtrl: ModalController,
    private loading: IDEALoadingService,
    private message: IDEAMessageService,
    private auth: IDEAAuthService
  ) {}
  async ngOnInit(): Promise<void> {
    try {
      await this.loading.show();
      this.isMFAEnabled = await this.auth.checkIfUserHasMFAEnabled(true);
      if (!this.isMFAEnabled) {
        const url = await this.auth.getURLForEnablingMFA();
        await this.generateQRCodeCanvasByURL(url);
      }
    } catch (error) {
      this.message.error('COMMON.OPERATION_FAILED');
    } finally {
      this.loading.hide();
    }
  }
  private generateQRCodeCanvasByURL(url: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const container = document.getElementById('qrCodeContainer');
      container.innerHTML = '';
      toCanvas(url, { errorCorrectionLevel: 'L' }, (err: Error, canvas: HTMLCanvasElement): void => {
        if (err) return reject(err);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '4px';
        container.appendChild(canvas);
        resolve();
      });
    });
  }

  async setMFA(enable: boolean): Promise<void> {
    if (!this.otpCode) return;
    try {
      await this.loading.show();
      if (enable) await this.auth.enableMFA(this.otpCode);
      else await this.auth.disableMFA(this.otpCode);
      this.isMFAEnabled = enable;
      this.message.success('COMMON.OPERATION_COMPLETED');
      this.modalCtrl.dismiss({ enabled: enable });
    } catch (error) {
      this.message.error('COMMON.OPERATION_FAILED');
    } finally {
      this.loading.hide();
    }
  }

  close(): void {
    this.modalCtrl.dismiss();
  }
}
