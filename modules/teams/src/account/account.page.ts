import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  NavController,
  IonList,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonListHeader,
  IonBadge,
  IonLabel
} from '@ionic/angular/standalone';
import { User } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEALoadingService,
  IDEAMessageService,
  IDEATranslatePipe,
  IDEATranslationsService
} from '@idea-ionic/common';
import { IDEATinCanService, IDEAAWSAPIService } from '@idea-ionic/uncommon';

@Component({
  selector: 'account',
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonLabel,
    IonBadge,
    IonListHeader,
    IonInput,
    IonItem,
    IonContent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonList
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button testId="closeButton" [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon name="arrow-back" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'IDEA_TEAMS.ACCOUNT.ACCOUNT' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="full" class="account">
        <ion-item>
          <ion-input
            testId="account.email"
            type="text"
            readonly="true"
            labelPlacement="stacked"
            [label]="'IDEA_TEAMS.ACCOUNT.EMAIL' | translate"
            [(ngModel)]="newEmail"
          />
          <ion-button
            testId="setNewEmailButton"
            slot="end"
            fill="clear"
            class="marginTop"
            [title]="'IDEA_TEAMS.ACCOUNT.SET_A_NEW_EMAIL' | translate"
            (click)="updateEmail()"
          >
            <ion-icon name="pencil" slot="icon-only" />
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-input
            testId="account.password"
            type="text"
            readonly="true"
            value="********"
            labelPlacement="stacked"
            [label]="'IDEA_TEAMS.ACCOUNT.PASSWORD' | translate"
          />
          <ion-button
            testId="setNewPasswordButton"
            slot="end"
            fill="clear"
            class="marginTop"
            [title]="'IDEA_TEAMS.ACCOUNT.SET_A_NEW_PASSWORD' | translate"
            (click)="updatePassword()"
          >
            <ion-icon name="pencil" slot="icon-only" />
          </ion-button>
        </ion-item>
        <ion-list-header class="disruptive">
          <ion-badge color="danger">
            <ion-icon name="nuclear" /> {{ 'IDEA_TEAMS.ACCOUNT.DISRUPTIVE_ACTIONS' | translate }}
          </ion-badge>
        </ion-list-header>
        <ion-item>
          <ion-label class="ion-text-wrap">
            {{ 'IDEA_TEAMS.ACCOUNT.USER_DELETION' | translate }}
            <p>
              {{ 'IDEA_TEAMS.ACCOUNT.IRREVERSIBLE_OPERATION' | translate }}
              <br />
              <i>{{ 'IDEA_TEAMS.ACCOUNT.YOU_MUST_LEAVE_ALL_TEAMS_FIRST' | translate }}</i>
            </p>
          </ion-label>
          <ion-button
            testId="deleteUserButton"
            slot="end"
            color="danger"
            [title]="'IDEA_TEAMS.ACCOUNT.DELETE_PERMANENTLY_USER' | translate"
            (click)="deleteUser()"
          >
            {{ 'IDEA_TEAMS.ACCOUNT.DELETE' | translate }}
          </ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .account {
        max-width: 500px;
        margin: 0 auto;
        background: transparent;
        ion-item {
          --background: var(--ion-color-white);
          --border-color: var(--ion-color-light);
        }
      }
      .disruptive {
        margin-top: 50px;
        padding-left: 0;
      }
      .marginTop {
        margin-top: 14px;
      }
    `
  ]
})
export class IDEAAccountPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _tc = inject(IDEATinCanService);
  private _nav = inject(NavController);
  private _alert = inject(AlertController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);

  user: User;
  newEmail: string;
  newPassword: string;
  newPasswordConfirm: string;

  ngOnInit(): void {
    this.user = new User(this._tc.get('user'));
    this.newEmail = this.user.email;
  }

  async updateEmail(): Promise<void> {
    const doUpdate = async ({ pwd, email }: any): Promise<void> => {
      if (!email) return this._message.info('IDEA_TEAMS.ACCOUNT.INVALID_EMAIL');
      try {
        await this._loading.show();
        const body = { password: pwd, newEmail: email, project: this._env.idea.project };
        await this._API.postResource('emailChangeRequests', { idea: true, body });
        const alert = await this._alert.create({
          header: this._translate._('COMMON.OPERATION_COMPLETED'),
          subHeader: this._translate._('IDEA_TEAMS.ACCOUNT.UPDATE_EMAIL_FLOW_EXPLANATION'),
          buttons: [this._translate._('COMMON.GOT_IT')]
        });
        alert.present();
      } catch (error) {
        this._message.error('IDEA_TEAMS.ACCOUNT.OPERATION_FAILED_PASSWORD');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('IDEA_TEAMS.ACCOUNT.UPDATE_EMAIL');
    const subHeader = this._translate._('IDEA_TEAMS.ACCOUNT.UPDATE_EMAIL_EXPLANATION');
    const inputs: any[] = [
      { name: 'pwd', type: 'password', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.YOUR_CURRENT_PASSWORD') },
      { name: 'email', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.NEW_EMAIL') }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doUpdate }
    ];
    const alert = await this._alert.create({ header, subHeader, inputs, buttons });
    alert.present();
  }
  async updatePassword(): Promise<void> {
    const doUpdate = async ({ old, newP, new2 }: any): Promise<void> => {
      if (newP.length < 8)
        this._message.warning(this._translate._('IDEA_TEAMS.ACCOUNT.INVALID_PASSWORD', { n: 8 }), true);
      else if (newP !== new2) this._message.warning('IDEA_TEAMS.ACCOUNT.PASSWORD_CONFIRMATION_DONT_MATCH');
      else {
        try {
          await this._loading.show();
          const body = { action: 'UPDATE_PASSWORD', password: old, newPassword: newP };
          await this._API.patchResource('users', { idea: true, resourceId: this.user.userId, body });
          this._message.success('IDEA_TEAMS.ACCOUNT.PASSWORD_UPDATED');
        } catch (error) {
          this._message.error('IDEA_TEAMS.ACCOUNT.OPERATION_FAILED_PASSWORD');
        } finally {
          this._loading.hide();
        }
      }
    };

    const header = this._translate._('IDEA_TEAMS.ACCOUNT.UPDATE_PASSWORD');
    const inputs: any[] = [
      { name: 'old', type: 'password', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.YOUR_CURRENT_PASSWORD') },
      { name: 'newP', type: 'password', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.NEW_PASSWORD_', { n: 8 }) },
      { name: 'new2', type: 'password', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.CONFIRM_NEW_PASSWORD') }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doUpdate }
    ];
    const alert = await this._alert.create({ header, inputs, buttons });
    alert.present();
  }

  async deleteUser(): Promise<void> {
    const doDelete = async ({ pwd }: any): Promise<void> => {
      try {
        await this._loading.show();
        await this._API.deleteResource('users', {
          idea: true,
          resourceId: this.user.userId,
          headers: { password: pwd }
        });
        window.location.assign('');
      } catch (error) {
        this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('IDEA_TEAMS.ACCOUNT.USER_DELETION');
    const subHeader = this._translate._('IDEA_TEAMS.ACCOUNT.USER_DELETION_ARE_YOU_SURE');
    const inputs: any[] = [
      { name: 'pwd', type: 'password', placeholder: this._translate._('IDEA_TEAMS.ACCOUNT.YOUR_CURRENT_PASSWORD') }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: doDelete }
    ];
    const alert = await this._alert.create({ header, subHeader, inputs, buttons });
    alert.present();
  }

  close(errorMessage?: string): void {
    if (errorMessage) this._message.error(errorMessage);
    try {
      this._nav.back();
    } catch (_) {
      this._nav.navigateRoot(['']);
    }
  }
}
