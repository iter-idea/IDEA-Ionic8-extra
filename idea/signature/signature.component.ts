import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import SignaturePad from 'signature_pad';

import { Signature } from './signature.model';
import { IDEAMessageService } from '../message.service';

@Component({
  selector: 'idea-signature',
  templateUrl: 'signature.component.html',
  styleUrls: ['signature.component.scss']
})
export class IDEASignatureComponent {
  /**
   * An existing signature to use.
   */
  @Input() public existingSignature: Signature;
  /**
   * The signature to manage.
   */
  public signature: Signature;
  /**
   * The canvas where the signature is painted.
   */
  public canvas: HTMLCanvasElement;
  /**
   * The signature pad.
   */
  public pad: SignaturePad;
  /**
   * Helper to report an error in the signatory field.
   */
  public signatoryError: boolean;
  /**
   * Helper to report an error in the signature canvas.
   */
  public signatureError: boolean;

  constructor(public modalCtrl: ModalController, public message: IDEAMessageService, public t: TranslateService) {
    this.signature = new Signature();
    this.canvas = null;
    this.pad = null;
  }
  public ionViewDidEnter() {
    this.canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
    this.pad = new SignaturePad(this.canvas);
    this.resizeCanvas();
    if (this.existingSignature) {
      this.signature.load(this.existingSignature);
      this.pad.fromDataURL(this.signature.pngURL);
    }
  }

  /**
   * Clear the canvas.
   */
  public clear() {
    this.pad.clear();
  }

  /**
   * Check Close the window and return the signature (text + different formats).
   */
  public save() {
    this.signatoryError = Boolean(!this.signature.signatory);
    this.signatureError = this.pad.isEmpty();
    if (this.signatoryError || this.signatureError)
      return this.message.warning('IDEA.SIGNATURE.VERIFY_SIGNATORY_AND_SIGNATURE');
    this.signature.jpegURL = this.pad.toDataURL('image/jpeg');
    this.signature.pngURL = this.pad.toDataURL('image/png');
    this.modalCtrl.dismiss(this.signature);
  }

  /**
   * Close and undo the signature.
   */
  public undo() {
    this.modalCtrl.dismiss(true);
  }

  /**
   * Close without saving.
   */
  public close() {
    this.modalCtrl.dismiss();
  }

  /**
   * Handling high DPI screens.
   */
  public resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.canvas.getContext('2d').scale(ratio, ratio);
    this.pad.clear();
  }
}
