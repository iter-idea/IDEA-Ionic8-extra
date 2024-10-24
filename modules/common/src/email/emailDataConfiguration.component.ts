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
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { EmailData, mdToHtml, StringVariable } from 'idea-toolbox';

import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEAListComponent } from '../list/list.component';

@Component({
  selector: 'idea-email-data-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEAHiglightedVariablesPipe,
    IDEAListComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon slot="icon-only" name="close" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title || 'IDEA_COMMON.EMAIL.EMAIL_DATA' | translate }}</ion-title>
        @if (!disabled) {
          <ion-buttons slot="end">
            <ion-button [title]="'COMMON.SAVE' | translate" (click)="save()">
              <ion-icon name="checkmark-circle" slot="icon-only" />
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list class="aList ion-padding" [class.viewMode]="disabled" [class.editMode]="!disabled">
        <idea-list
          [data]="emailDataWC.to"
          [label]="'IDEA_COMMON.EMAIL.TO' | translate"
          [lines]="lines"
          [disabled]="disabled"
        />
        <idea-list
          [data]="emailDataWC.cc"
          [label]="'IDEA_COMMON.EMAIL.CC' | translate"
          [lines]="lines"
          [disabled]="disabled"
        />
        <idea-list
          [data]="emailDataWC.bcc"
          [label]="'IDEA_COMMON.EMAIL.BCC' | translate"
          [lines]="lines"
          [disabled]="disabled"
        />
        <ion-item [lines]="lines">
          <ion-label position="stacked">{{ 'IDEA_COMMON.EMAIL.SUBJECT' | translate }}</ion-label>
          @if (disabled) {
            <div class="innerContent" [innerHTML]="emailDataWC.subject | highlight: variablesPlain"></div>
          }
          @if (!disabled) {
            <ion-input type="text" [(ngModel)]="emailDataWC.subject" />
          }
        </ion-item>
        <ion-item [lines]="lines">
          <ion-label position="stacked">{{ 'IDEA_COMMON.EMAIL.CONTENT' | translate }}</ion-label>
          @if (disabled) {
            <div class="innerContent md" [innerHTML]="mdToHtml(emailDataWC.content) | highlight: variablesPlain"></div>
          }
          @if (!disabled) {
            <ion-textarea maxlength="1000" [rows]="8" [(ngModel)]="emailDataWC.content" />
          }
        </ion-item>
      </ion-list>
      @if (!disabled) {
        <ion-list class="aList ion-padding">
          <ion-list-header>
            <ion-label>
              <h2>{{ 'IDEA_COMMON.EMAIL.VARIABLES_AVAILABLE' | translate }}</h2>
              <p>{{ 'IDEA_COMMON.EMAIL.VARIABLES_AVAILABLE_I' | translate }}</p>
            </ion-label>
          </ion-list-header>
          <ul class="variablesList">
            @for (v of variables; track v) {
              <li>
                <small>{{ v.code }}</small> {{ v.description }}
              </li>
            }
          </ul>
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    `
      .content {
        margin: 10px 0;
        min-height: 20px;
        height: auto;
        line-height: 20px;
        width: 100%;
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
export class IDEAEmailDataConfigurationComponent implements OnInit {
  private _modal = inject(ModalController);

  /**
   * The emailData to configure.
   */
  @Input() emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
  /**
   * The title for the component.
   */
  @Input() title: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  emailDataWC: EmailData;
  variablesPlain: string[];

  ngOnInit(): void {
    this.emailDataWC = new EmailData(this.emailData);
    this.variablesPlain = (this.variables || []).map(x => x.code);
  }

  mdToHtml(content: string): string {
    return mdToHtml(content);
  }

  save(): void {
    this.emailData.load(this.emailDataWC);
    this.close();
  }

  close(): void {
    this._modal.dismiss();
  }
}
