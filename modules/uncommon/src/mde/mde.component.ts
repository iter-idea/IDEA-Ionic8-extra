import { Component, Input, OnInit, inject, ChangeDetectionStrategy, input } from '@angular/core';
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
  imports: [
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
          {{ title() || ('IDEA_UNCOMMON.MDE.TITLE' | translate) }}
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
      <ion-textarea rows="12" [id]="id" [placeholder]="placeholder()" [(ngModel)]="value" />
      <idea-mde-toolbar />
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() id: string;
  /**
   * The title of the modal.
   */
  readonly title = input<string>();
  /**
   * The header text content.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() header: string;
  /**
   * The sub-header description.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() description: string;
  /**
   * A series of text variables to substitute with values.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() variables: string[];
  /**
   * If set, will customize the initial value of the editor.
   */
  readonly initialValue = input<string>();
  /**
   * Custom placeholder that should be displayed.
   */
  readonly placeholder = input<string>();

  value: string;

  ngOnInit(): void {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
    this.value = this.initialValue();
  }

  close(): void {
    this._modal.dismiss();
  }
  confirm(): void {
    this._modal.dismiss(this.value);
  }
}
