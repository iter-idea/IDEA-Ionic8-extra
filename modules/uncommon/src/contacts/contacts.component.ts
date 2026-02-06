import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonItem, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { Contacts } from 'idea-toolbox';
import { IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-contacts',
  imports: [CommonModule, FormsModule, IDEATranslatePipe, IonInput, IonIcon, IonButton, IonItem],
  template: `
    <div class="contacts">
      @if (showName) {
        <ion-item [lines]="lines" [color]="color">
          <ion-input
            autocomplete="new"
            labelPlacement="stacked"
            [label]="'IDEA_UNCOMMON.CONTACTS.NAME' | translate"
            [disabled]="!editMode"
            [placeholder]="'IDEA_UNCOMMON.CONTACTS.NAME_HINT' | translate"
            [title]="'IDEA_UNCOMMON.CONTACTS.NAME_HINT' | translate"
            [(ngModel)]="contacts.name"
          />
        </ion-item>
      }
      <ion-item [lines]="lines" [color]="color">
        <ion-input
          autocomplete="new"
          labelPlacement="stacked"
          [label]="'IDEA_UNCOMMON.CONTACTS.PHONE' | translate"
          [disabled]="!editMode"
          [placeholder]="'IDEA_UNCOMMON.CONTACTS.PHONE_HINT' | translate"
          [title]="'IDEA_UNCOMMON.CONTACTS.PHONE_HINT' | translate"
          [(ngModel)]="contacts.phone"
        />
        @if (!editMode) {
          <ion-button
            slot="end"
            fill="clear"
            color="dark"
            class="marginTop"
            [title]="'IDEA_UNCOMMON.CONTACTS.CALL' | translate"
            (click)="call()"
          >
            <ion-icon name="call" slot="icon-only" />
          </ion-button>
        }
      </ion-item>
      <ion-item [lines]="lines" [color]="color">
        <ion-input
          autocomplete="new"
          labelPlacement="stacked"
          [label]="'IDEA_UNCOMMON.CONTACTS.EMAIL' | translate"
          [disabled]="!editMode"
          [placeholder]="'IDEA_UNCOMMON.CONTACTS.EMAIL_HINT' | translate"
          [title]="'IDEA_UNCOMMON.CONTACTS.EMAIL_HINT' | translate"
          [(ngModel)]="contacts.email"
        />
        @if (!editMode) {
          <ion-button
            slot="end"
            fill="clear"
            color="dark"
            class="marginTop"
            [title]="'IDEA_UNCOMMON.CONTACTS.SEND_EMAIL' | translate"
            (click)="sendEmail()"
          >
            <ion-icon name="mail" slot="icon-only" />
          </ion-button>
        }
      </ion-item>
    </div>
  `,
  styles: [
    `
      .marginTop {
        margin-top: 14px;
      }
    `
  ]
})
export class IDEAContactsComponent {
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The contacts to manage.
   */
  @Input() contacts: Contacts = new Contacts();
  /**
   * If true, show the field `name`.
   */
  @Input() showName = false;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() editMode = true;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;

  sendEmail(): void {
    if (!this.contacts.email) return;
    const url = `mailto:${this.contacts.email}`;
    this.preExternalAction(this.contacts.email, (): Window => window.open(url, '_system'));
  }
  call(): void {
    if (!this.contacts.phone) return;
    const url = `tel:${this.contacts.phone}`;
    this.preExternalAction(this.contacts.phone, (): Window => window.open(url, '_system'));
  }

  private preExternalAction(message: string, cb: () => void): void {
    const header = this._translate._('COMMON.DO_YOU_WANT_TO_PROCEED');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL') },
      { text: this._translate._('COMMON.CONFIRM'), handler: (): void => cb() }
    ];
    const cssClass = 'selectableAlertMessage';
    this._alert.create({ header, message, buttons, cssClass }).then(alert => alert.present());
  }
}
