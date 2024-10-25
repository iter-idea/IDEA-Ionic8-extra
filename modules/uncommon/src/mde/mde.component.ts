import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';
import { IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAMDEToolbarComponent } from './mdeToolbar.component';

@Component({
  selector: 'idea-mde',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEAMDEToolbarComponent,
    IonTextarea,
    IonText,
    IonContent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'IDEA_UNCOMMON.MDE.CLOSE_WITHOUT_SAVING' | translate" (click)="close()">
            <ion-icon name="close" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>
          {{ title || ('IDEA_UNCOMMON.MDE.TITLE' | translate) }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button [title]="'IDEA_UNCOMMON.MDE.SAVE_AND_CLOSE' | translate" (click)="confirm()">
            <ion-icon name="checkmark" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (header) {
        <h2 class="header">
          {{ header }}
        </h2>
      }
      @if (description) {
        <p class="description">
          {{ description }}
        </p>
      }
      @if (variables?.length) {
        <p class="variables">
          <b> {{ 'IDEA_UNCOMMON.MDE.VARIABLES' | translate }}: </b>
          @for (v of variables; track v) {
            <ion-text>
              {{ v.concat(' ') }}
            </ion-text>
          }
        </p>
      }
      <ion-textarea rows="12" [id]="id" [placeholder]="placeholder" [(ngModel)]="value" />
      <idea-mde-toolbar />
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --ion-background-color: #f4f4f4;
      }
      h2.header {
        margin: 0;
        font-size: 0.7em;
        font-weight: bold;
        text-transform: uppercase;
      }
      .description {
        margin-top: 5px;
        margin-bottom: 20px;
        font-size: 0.9em;
      }
      .variables {
        margin: 10px 5px;
        font-size: 0.8em;
      }
      ion-textarea {
        --background: var(--ion-color-white);
        padding: 10px;
      }
    `
  ]
})
export class IDEAMDEComponent implements OnInit {
  private _modal = inject(ModalController);

  /**
   * Id to identify this specific Markdown Editor (default: 'mde').
   */
  @Input() id: string;
  /**
   * The title of the modal.
   */
  @Input() title: string;
  /**
   * The header text content.
   */
  @Input() header: string;
  /**
   * The sub-header description.
   */
  @Input() description: string;
  /**
   * A series of text variables to substitute with values.
   */
  @Input() variables: string[];
  /**
   * If set, will customize the initial value of the editor.
   */
  @Input() initialValue: string;
  /**
   * Custom placeholder that should be displayed.
   */
  @Input() placeholder: string;

  value: string;

  ngOnInit(): void {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
    this.value = this.initialValue;
  }

  close(): void {
    this._modal.dismiss();
  }
  confirm(): void {
    this._modal.dismiss(this.value);
  }
}
