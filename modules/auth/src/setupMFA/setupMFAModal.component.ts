import { Component, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { toCanvas } from 'qrcode';
import { IDEALoadingService, IDEAMessageService } from '@idea-ionic/common';

import { IDEAAuthService } from '../auth.service';

@Component({
  selector: 'idea-setup-mfa-modal',
  templateUrl: 'setupMFAModal.component.html',
  styleUrls: ['setupMFAModal.component.scss']
})
export class IDEASetupMFAModalComponent implements OnInit {
  otpCode: string;
  isMFAEnabled: boolean;

  private _modal = inject(ModalController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _auth = inject(IDEAAuthService);

  async ngOnInit(): Promise<void> {
    try {
      await this._loading.show();
      this.isMFAEnabled = await this._auth.checkIfUserHasMFAEnabled(true);
      if (!this.isMFAEnabled) {
        const url = await this._auth.getURLForEnablingMFA();
        await this.generateQRCodeCanvasByURL(url);
      }
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
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
      await this._loading.show();
      if (enable) await this._auth.enableMFA(this.otpCode);
      else await this._auth.disableMFA(this.otpCode);
      this.isMFAEnabled = enable;
      this._message.success('COMMON.OPERATION_COMPLETED');
      this._modal.dismiss({ enabled: enable });
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  close(): void {
    this._modal.dismiss();
  }
}
