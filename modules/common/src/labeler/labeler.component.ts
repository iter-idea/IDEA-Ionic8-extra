import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  Platform,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonTitle,
  IonListHeader,
  IonLabel,
  IonList,
  IonItem,
  IonThumbnail,
  IonTextarea,
  IonText,
  IonInput
} from '@ionic/angular/standalone';
import { Label, LabelVariable, Languages, StringVariable } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEAMessageService } from '../message.service';

/**
 * A component for filling in an Label.
 */
@Component({
  selector: 'idea-labeler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonList,
    IonListHeader,
    IonLabel,
    IonItem,
    IonInput,
    IonThumbnail,
    IonTextarea,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CANCEL' | translate" (click)="close()">
            <ion-icon slot="icon-only" name="close" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        @if (!disabled) {
          <ion-buttons slot="end">
            <ion-button [title]="'COMMON.SAVE' | translate" (click)="save()">
              <ion-icon slot="icon-only" name="checkmark" />
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
    <ion-content [class.ion-padding]="isLargeScreen()">
      @if (variables?.length && !disabled) {
        <ion-list class="aList">
          <ion-list-header>
            <ion-label>
              <h2>{{ 'IDEA_COMMON.LABELER.VARIABLES_AVAILABLE' | translate }}</h2>
              <p>{{ 'IDEA_COMMON.LABELER.VARIABLES_AVAILABLE_I' | translate }}</p>
            </ion-label>
          </ion-list-header>
          <ul class="variablesList">
            @for (v of variables; track v) {
              <li>
                <small>{{ v.code }}</small> {{ getVariableDescription(v) }}
              </li>
            }
          </ul>
        </ion-list>
      }
      @if (!disabled) {
        <p class="explanation">
          @if (obligatory) {
            <span>{{ 'IDEA_COMMON.LABELER.EXPLANATION_OBLIGATORY' | translate }}</span>
          }
          {{ 'IDEA_COMMON.LABELER.EXPLANATION' | translate }}
        </p>
      }
      @if (_label) {
        <ion-list class="aList" [class.viewMode]="disabled">
          @for (l of languages.available; track l) {
            <ion-item lines="inset" [class.fieldHasError]="hasFieldAnError(l)">
              <ion-thumbnail slot="start"><img [src]="getFlagURL(l)" /></ion-thumbnail>
              <ion-label position="stacked">
                {{ l }}
                @if (l === languages.default) {
                  <ion-text>- {{ 'COMMON.DEFAULT' | translate }}</ion-text>
                }
              </ion-label>
              @if (!textarea) {
                <ion-input type="text" [(ngModel)]="_label[l]" [disabled]="disabled" />
              }
              @if (textarea) {
                <ion-textarea [(ngModel)]="_label[l]" [disabled]="disabled" [rows]="3" [autoGrow]="true" />
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    `
      ion-list.aList {
        border-radius: 5px;
        ion-item {
          --border-color: var(--ion-color-light);
          ion-thumbnail {
            width: 20px;
            height: 20px;
            margin-top: 16px;
            margin-right: 20px;
            img {
              border-radius: 8px;
            }
          }
          ion-textarea {
            --padding-top: 2px;
            --padding-bottom: 16px;
          }
        }
      }
      ion-list.aList:first-of-type {
        ion-list-header {
          margin-top: 0;
        }
      }
      p.explanation {
        margin: 15px 12px 20px 12px;
        font-size: 0.9em;
        color: var(--ion-color-dark-tint);
      }
      .variablesList {
        margin: 0;
        li {
          padding: 3px;
          color: var(--ion-color-dark);
          font-size: 0.9em;
        }
      }
    `
  ]
})
export class IDEALabelerComponent {
  private _platform = inject(Platform);
  private _modal = inject(ModalController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  /**
   * The detail to highlight.
   */
  @Input() label: Label;
  /**
   * The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
   */
  @Input() languages: Languages;
  /**
   * The optional title for the component.
   */
  @Input() title: string;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  @Input() textarea: boolean;
  /**
   * Whether the label supports markdown.
   */
  @Input() markdown: boolean;
  /**
   * The variables the user can use for the label content.
   */
  @Input() variables: (StringVariable | LabelVariable)[];
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the label is validated on save.
   */
  @Input() obligatory: boolean;

  _label: Label;
  errors = new Set<string>();

  ionViewDidEnter(): void {
    this.title = this.title || this._translate._('IDEA_COMMON.LABELER.MANAGE_LABEL');
    this.languages = this.languages || this._translate.languages();
    this._label = new Label(this.label, this.languages);
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  getFlagURL(lang: string): string {
    return `assets/flags/${lang}.png`;
  }

  getVariableDescription(v: StringVariable | LabelVariable): string {
    const isLabel = Boolean((v as any).label);
    if (isLabel) {
      v = v as LabelVariable;
      return v.label.translate(this.languages.default, this.languages);
    } else {
      v = v as StringVariable;
      return v.description;
    }
  }

  save(): Promise<void> {
    if (this.obligatory) {
      this.errors = new Set(this._label.validate(this.languages));
      if (this.errors.size) return this._message.error('IDEA_COMMON.LABELER.FILL_IN_DEFAULT_LANGUAGE');
    }
    this.label.load(this._label, this.languages);
    this._modal.dismiss(true);
  }

  close(): void {
    this._modal.dismiss();
  }

  isLargeScreen(): boolean {
    return this._platform.width() > 500;
  }
}
