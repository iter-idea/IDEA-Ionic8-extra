import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import SignaturePad from 'signature_pad';
import { Signature, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAMessageService } from '../message.service';

const SIGNATURE_SIZE_LIMIT = 80 * 1000; // 80 K

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
   * Whether it is possible or not to edit an existing signature.
   */
  @Input() public preventEditing: boolean;
  /**
   * A list of contacts that could be the signatory of this signature.
   */
  @Input() public contacts: Array<string>;
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

  constructor(
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {
    this.signature = new Signature();
    this.canvas = null;
    this.pad = null;
  }
  public ionViewDidEnter() {
    // prepare the canvas area for the signature
    this.canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
    this.pad = new SignaturePad(this.canvas);
    this.resizeCanvas();
    // in case a signature already exists, show it
    if (this.existingSignature) {
      this.signature.load(this.existingSignature);
      this.pad.fromDataURL(this.signature.pngURL);
      if (this.canEdit()) this.pad.on();
      else this.pad.off();
    }
    // pre-load the first contact, if any (and the signatory isn't already filled out)
    if (this.contacts.length && !this.signature.signatory) this.signature.signatory = this.contacts[0];
  }

  /**
   * Whether an existing signature can be edited.
   */
  public canEdit(): boolean {
    return !this.existingSignature || !this.preventEditing;
  }

  /**
   * Pick a signatory from the contacts.
   */
  public pickSignatory() {
    this.modalCtrl
      .create({
        component: 'idea-suggestions',
        componentProps: {
          data: (this.contacts || []).map(c => new Suggestion({ value: c })),
          searchPlaceholder: this.t._('IDEA.SIGNATURE.CHOOSE_A_SIGNATORY'),
          hideClearButton: true
        }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: any) => {
          if (res && res.data && res.data.value) this.signature.signatory = res.data.value;
        });
        modal.present();
      });
  }

  /**
   * Clear the canvas.
   */
  public clear() {
    this.pad.clear();
  }

  /**
   * Check Close the window and return the signature.
   */
  public save() {
    // check whether the fields are empty
    this.signatoryError = Boolean(!this.signature.signatory);
    this.signatureError = this.pad.isEmpty();
    if (this.signatoryError || this.signatureError)
      return this.message.warning('IDEA.SIGNATURE.VERIFY_SIGNATORY_AND_SIGNATURE');
    // load the signature URL
    this.signature.pngURL = this.pad.toDataURL('image/png');
    // check whether the signature size is acceptable
    this.signatureError = this.signature.pngURL.length > SIGNATURE_SIZE_LIMIT;
    if (this.signatureError) return this.message.warning('IDEA.SIGNATURE.SIGNATURE_IS_TOO_COMPLEX');
    // update the timestamp
    this.signature.timestamp = Date.now();
    // close the modal
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
