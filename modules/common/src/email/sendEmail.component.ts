import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonListHeader,
  IonLabel,
  IonItem,
  IonTextarea,
  IonInput
} from '@ionic/angular/standalone';
import { EmailData, StringVariable, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

@Component({
  selector: 'idea-send-email',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonListHeader,
    IonLabel,
    IonItem,
    IonTextarea,
    IonInput
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon slot="icon-only" name="close" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'IDEA_COMMON.EMAIL.SEND_EMAIL' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button [title]="'IDEA_COMMON.EMAIL.SEND_EMAIL' | translate" [disabled]="!canSend()" (click)="send()">
            <ion-icon slot="icon-only" name="send" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list class="aList sendEmailList">
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.TO' | translate }}</h2>
          </ion-label>
          <ion-button color="dark" (click)="addAddressToList(emailWC.to)">
            <ion-icon slot="icon-only" name="add-circle" />
          </ion-button>
        </ion-list-header>
        @if (!emailWC.to.length) {
          <ion-item>
            <i>{{ 'IDEA_COMMON.EMAIL.NO_ADDRESSES' | translate }}</i>
          </ion-item>
        }
        @for (x of emailWC.to; track x) {
          <ion-item>
            <ion-button fill="clear" slot="start" (click)="removeAddressFromList(emailWC.to, x)">
              <ion-icon slot="icon-only" name="remove" />
            </ion-button>
            <ion-label>{{ x }}</ion-label>
          </ion-item>
        }
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.CC' | translate }}</h2>
          </ion-label>
          <ion-button color="dark" (click)="addAddressToList(emailWC.cc)">
            <ion-icon slot="icon-only" name="add-circle" />
          </ion-button>
        </ion-list-header>
        @if (!emailWC.cc.length) {
          <ion-item>
            <i>{{ 'IDEA_COMMON.EMAIL.NO_ADDRESSES' | translate }}</i>
          </ion-item>
        }
        @for (x of emailWC.cc; track x) {
          <ion-item>
            <ion-button fill="clear" slot="start" (click)="removeAddressFromList(emailWC.cc, x)">
              <ion-icon slot="icon-only" name="remove" />
            </ion-button>
            <ion-label>{{ x }}</ion-label>
          </ion-item>
        }
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.BCC' | translate }}</h2>
          </ion-label>
          <ion-button color="dark" (click)="addAddressToList(emailWC.bcc)">
            <ion-icon slot="icon-only" name="add-circle" />
          </ion-button>
        </ion-list-header>
        @if (!emailWC.bcc.length) {
          <ion-item>
            <i>{{ 'IDEA_COMMON.EMAIL.NO_ADDRESSES' | translate }}</i>
          </ion-item>
        }
        @for (x of emailWC.bcc; track x) {
          <ion-item>
            <ion-button fill="clear" slot="start" (click)="removeAddressFromList(emailWC.bcc, x)">
              <ion-icon slot="icon-only" name="remove" />
            </ion-button>
            <ion-label>{{ x }}</ion-label>
          </ion-item>
        }
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.SUBJECT' | translate }}</h2>
          </ion-label>
        </ion-list-header>
        <ion-item [lines]="lines">
          <ion-input type="text" [(ngModel)]="emailWC.subject" />
        </ion-item>
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.CONTENT' | translate }}</h2>
          </ion-label>
        </ion-list-header>
        <ion-item [lines]="lines">
          <ion-textarea [rows]="13" [(ngModel)]="emailWC.content" />
        </ion-item>
        <ion-list-header>
          <ion-label>
            <h2>{{ 'IDEA_COMMON.EMAIL.ATTACHMENTS' | translate }}</h2>
          </ion-label>
        </ion-list-header>
        @if (!attachments.length) {
          <ion-item>
            <i>{{ 'IDEA_COMMON.EMAIL.NO_ATTACHMENTS' | translate }}</i>
          </ion-item>
        }
        @for (a of attachments; track a) {
          <ion-item><ion-icon slot="start" name="attach" />{{ a }}</ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .aList.sendEmailList {
        ion-list-header ion-label {
          margin: 25px 0 10px 0;
        }
      }
    `
  ]
})
export class IDEASendEmailComponent implements OnInit {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The content and receivers of the email.
   */
  @Input() email: EmailData;
  /**
   * Visual indicators of the attachments that will be sent.
   */
  @Input() attachments: string[];
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
  /**
   * A map of the values to substitute to the variables.
   */
  @Input() values: { [variable: string]: string | number };
  /**
   * The suggested contacts for the email composer.
   */
  @Input() contacts: Suggestion[];
  /**
   * Lines preferences for the items.
   */
  @Input() lines: string;

  emailWC: EmailData;

  ngOnInit(): void {
    this.emailWC = new EmailData(this.email);
    if (!this.variables) this.variables = new Array<StringVariable>();
    if (!this.values) this.values = {};
    this.variables.forEach(v => {
      if (this.values[v.code]) {
        if (this.emailWC.subject)
          this.emailWC.subject = this.emailWC.subject.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
        if (this.emailWC.content)
          this.emailWC.content = this.emailWC.content.replace(new RegExp(v.code, 'g'), String(this.values[v.code]));
      }
    });
  }

  async addAddressToList(list: string[]): Promise<void> {
    const modal = await this._modal.create({
      component: IDEASuggestionsComponent,
      componentProps: {
        data: this.contacts || [],
        sortData: true,
        searchPlaceholder: this._translate._('IDEA_COMMON.EMAIL.CHOOSE_OR_ADD_AN_ADDRESS'),
        noElementsFoundText: this._translate._('IDEA_COMMON.EMAIL.NO_ADDRESS_FOUND_YOU_CAN_ADD_ONE'),
        allowUnlistedValues: true,
        lines: this.lines
      }
    });
    modal.onDidDismiss().then(res => {
      if (res && res.data && res.data.value && !list.includes(res.data.value)) list.push(res.data.value);
    });
    modal.present();
  }
  removeAddressFromList(list: string[], address: string): void {
    list.splice(list.indexOf(address), 1);
  }

  canSend(): boolean {
    return Boolean(this.emailWC.to.length && this.emailWC.subject && this.emailWC.content);
  }
  send(): void {
    this.email.load(this.emailWC);
    this._modal.dismiss(this.email);
  }

  close(): void {
    this._modal.dismiss();
  }
}
