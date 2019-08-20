import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import SignaturePad from 'signature_pad';

import { IDEAMessageService } from '../message.service';

@Component({
  selector: 'idea-signature',
  templateUrl: 'signature.component.html',
  styleUrls: ['signature.component.scss']
})
export class IDEASignatureComponent {
  public signature: Signature;
  public canvas: HTMLCanvasElement;
  public pad: SignaturePad;

  public signatoryError: boolean;
  public signatureError: boolean;

  constructor(public modalCrl: ModalController, public message: IDEAMessageService, public t: TranslateService) {
    this.signature = { signatory: null, pngURL: null, jpegURL: null };
    this.canvas = null;
    this.pad = null;
  }
  public ionViewDidEnter() {
    this.canvas = <HTMLCanvasElement>document.getElementById('signatureCanvas');
    this.pad = new SignaturePad(this.canvas);
    this.resizeCanvas();
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
    this.modalCrl.dismiss(this.signature);
  }

  /**
   * Close without saving.
   */
  public close() {
    this.modalCrl.dismiss();
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

/**
 * The signature, composed by a signatory and various dataURI formats.
 */
export interface Signature {
  signatory: string;
  pngURL: string;
  jpegURL: string;
}
