import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { ModalController, IonItem, IonButton, IonIcon, IonText, IonLabel } from '@ionic/angular/standalone';
import { EmailData, StringVariable } from 'idea-toolbox';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';

import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';

/**
 * Configurator of EmailData.
 */
@Component({
  selector: 'idea-email-data',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IDEAHiglightedVariablesPipe,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonText
  ],
  template: `
    <ion-item
      class="emailDataItem"
      button
      [disabled]="isOpening"
      [color]="color"
      [lines]="lines"
      [title]="placeholder || ''"
      [class.withLabel]="label"
      (click)="openEmailDataConfiguration()"
    >
      @if (icon) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor"
          [class.marginTop]="label"
          (click)="doIconSelect($event)"
        >
          <ion-icon [name]="icon" slot="icon-only" />
        </ion-button>
      }
      @if (label) {
        <ion-label position="stacked">{{ label }}</ion-label>
      }
      <div class="description">
        @if (!emailData.subject) {
          <div class="placeholder">{{ placeholder }}</div>
        }
        @if (emailData.subject) {
          <div [innerHTML]="emailData.subject | highlight: variablesPlain"></div>
        }
        @if (emailData.to.length) {
          <p>
            <ion-text>{{ 'IDEA_COMMON.EMAIL.TO' | translate }}:</ion-text> {{ emailData.to.join(', ') }}
          </p>
        }
        @if (emailData.cc.length) {
          <p>
            <ion-text>{{ 'IDEA_COMMON.EMAIL.CC' | translate }}:</ion-text> {{ emailData.cc.join(', ') }}
          </p>
        }
        @if (emailData.bcc.length) {
          <p>
            <ion-text>{{ 'IDEA_COMMON.EMAIL.BCC' | translate }}:</ion-text> {{ emailData.bcc.join(', ') }}
          </p>
        }
      </div>
      <ion-icon slot="end" name="chevron-forward" class="selectIcon" />
    </ion-item>
  `,
  styles: [
    `
      .emailDataItem {
        min-height: 48px;
        height: auto;
        .description {
          margin: 10px 0;
          min-height: 20px;
          height: auto;
          line-height: 20px;
          width: 100%;
          p {
            margin: 2px 10px;
            font-size: 0.8em;
            ion-text {
              font-weight: bold;
            }
          }
          p:first-of-type {
            margin-top: 10px;
          }
        }
        .placeholder {
          color: var(--ion-color-medium);
        }
        .selectIcon {
          color: var(--ion-text-color-step-500);
          font-size: 1.3em;
        }
      }
      .emailDataItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 4px;
        }
        ion-button[slot='start'] {
          margin-top: 16px;
        }
      }
    `
  ]
})
export class IDEAEmailDataComponent implements OnInit {
  private _modal = inject(ModalController);

  /**
   * The email data to manage.
   */
  @Input() emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
  /**
   * The label for the field.
   */
  @Input() label: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * On change event.
   */
  @Output() change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();
  /**
   * The list of variables codes to use for substitutions.
   */
  variablesPlain: string[];

  isOpening = false;

  ngOnInit(): void {
    // create a plain list of variable codes
    this.variablesPlain = (this.variables || []).map(x => x.code);
  }

  async openEmailDataConfiguration(): Promise<void> {
    if (this.isOpening) return;
    this.isOpening = true;
    const modal = await this._modal.create({
      component: IDEAEmailDataConfigurationComponent,
      componentProps: {
        emailData: this.emailData,
        variables: this.variables,
        title: this.label,
        disabled: this.disabled,
        lines: this.lines
      }
    });
    modal.onDidDismiss().then(res => (res && res.data ? this.change.emit() : null));
    modal.present();
    this.isOpening = false;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
