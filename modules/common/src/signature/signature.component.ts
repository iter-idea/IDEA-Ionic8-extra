import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRow,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import SignaturePad from 'signature_pad';
import { Signature, Suggestion } from 'idea-toolbox';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEASuggestionsComponent } from '../select/suggestions.component';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

const SIGNATURE_SIZE_LIMIT = 80 * 1000; // 80 K

@Component({
  selector: 'idea-signature',
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonHeader,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonLabel,
    IonItem,
    IonInput,
    IonRow,
    IonCol
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'IDEA_COMMON.SIGNATURE.CANCEL' | translate" (click)="close()">
            <ion-icon icon="close" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'IDEA_COMMON.SIGNATURE.SIGNATURE' | translate }}</ion-title>
        <ion-buttons slot="end">
          @if (existingSignature) {
            <ion-button [title]="'IDEA_COMMON.SIGNATURE.CLEAR_SIGNATURE' | translate" (click)="undo()">
              <ion-icon icon="arrow-undo" slot="icon-only" />
            </ion-button>
          }
          @if (canEdit()) {
            <ion-button [title]="'IDEA_COMMON.SIGNATURE.SAVE_SIGNATURE' | translate" (click)="save()">
              <ion-icon icon="checkmark" slot="icon-only" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list class="aList">
        <ion-list-header>
          <ion-label>{{ 'IDEA_COMMON.SIGNATURE.SIGNATORY' | translate }}</ion-label>
        </ion-list-header>
        <ion-item lines="none">
          <ion-input
            type="text"
            [placeholder]="'IDEA_COMMON.SIGNATURE.NAME_AND_SURNAME' | translate"
            [disabled]="!canEdit()"
            [class.fieldHasError]="signatoryError"
            [(ngModel)]="signature.signatory"
          />
          @if (contacts.length && canEdit()) {
            <ion-button
              fill="clear"
              color="dark"
              slot="end"
              [title]="'IDEA_COMMON.SIGNATURE.CHOOSE_FROM_CONTACTS' | translate"
              (click)="pickSignatory()"
            >
              <ion-icon icon="person-circle" slot="icon-only" />
            </ion-button>
          }
        </ion-item>
      </ion-list>
      <ion-list class="aList">
        <ion-list-header>
          <ion-label>{{ 'IDEA_COMMON.SIGNATURE.SIGNATURE_EXPLANATION' | translate }}</ion-label>
        </ion-list-header>
        <div class="canvasContainer" [class.fieldHasError]="signatureError">
          <canvas id="signatureCanvas"></canvas>
        </div>
        @if (canEdit()) {
          <ion-row>
            <ion-col class="ion-text-right">
              <ion-button fill="clear" [title]="'IDEA_COMMON.SIGNATURE.CLEAR_SIGNATURE' | translate" (click)="clear()">
                <ion-icon icon="trash-outline" slot="icon-only" />
              </ion-button>
            </ion-col>
          </ion-row>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .aList {
        ion-list-header {
          font-size: 0.7em;
          font-weight: bold;
          text-transform: uppercase;
        }
        .canvasContainer {
          margin: 0 auto;
          text-align: center;
          background: white;
          #signatureCanvas {
            width: 100%;
            height: 250px;
          }
        }
        .canvasContainer.fieldHasError {
          border-bottom: 2px solid var(--ion-color-danger) !important;
        }
        .fieldHasError {
          --border-color: var(--ion-color-danger) !important;
          --inner-border-width: 0 0 2px 0 !important;
        }
      }
    `
  ]
})
export class IDEASignatureComponent {
  private _modal = inject(ModalController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  /**
   * An existing signature to use.
   */
  @Input() existingSignature: Signature;
  /**
   * Whether it is possible or not to edit an existing signature.
   */
  @Input() preventEditing: boolean;
  /**
   * A list of contacts that could be the signatory of this signature.
   */
  @Input() contacts: string[];

  signature = new Signature();
  canvas: HTMLCanvasElement | null = null;
  pad: SignaturePad | null = null;
  signatoryError: boolean;
  signatureError: boolean;

  ionViewDidEnter(): void {
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

  canEdit(): boolean {
    return !this.existingSignature || !this.preventEditing;
  }

  async pickSignatory(): Promise<void> {
    const modal = await this._modal.create({
      component: IDEASuggestionsComponent,
      componentProps: {
        data: (this.contacts || []).map(c => new Suggestion({ value: c })),
        searchPlaceholder: this._translate._('IDEA_COMMON.SIGNATURE.CHOOSE_A_SIGNATORY'),
        hideClearButton: true
      }
    });
    modal.onDidDismiss().then(res => {
      if (res && res.data && res.data.value) this.signature.signatory = res.data.value;
    });
    modal.present();
  }

  clear(): void {
    this.pad.clear();
  }

  save(): Promise<void> {
    // check whether the fields are empty
    this.signatoryError = !this.signature.signatory?.trim();
    this.signatureError = this.pad.isEmpty();
    if (this.signatoryError || this.signatureError)
      return this._message.warning('IDEA_COMMON.SIGNATURE.VERIFY_SIGNATORY_AND_SIGNATURE');
    // load the signature URL
    this.signature.pngURL = this.pad.toDataURL('image/png');
    // check whether the signature size is acceptable
    this.signatureError = this.signature.pngURL.length > SIGNATURE_SIZE_LIMIT;
    if (this.signatureError) return this._message.warning('IDEA_COMMON.SIGNATURE.SIGNATURE_IS_TOO_COMPLEX');
    // clean the signatory string
    this.signature.signatory = this.signature.signatory.trim();
    // update the timestamp
    this.signature.timestamp = Date.now();
    // close the modal
    this._modal.dismiss(this.signature);
  }

  undo(): void {
    this._modal.dismiss(true);
  }

  close(): void {
    this._modal.dismiss();
  }

  resizeCanvas(): void {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.canvas.getContext('2d').scale(ratio, ratio);
    this.pad.clear();
  }
}
