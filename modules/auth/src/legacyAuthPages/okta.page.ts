import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonImg
} from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEATranslatePipe } from '@idea-ionic/common';

import { storeCognitoSession } from '../okta.helpers';

@Component({
  selector: 'okta',
  imports: [IDEATranslatePipe, IonContent, IonCard, IonImg, IonCardHeader, IonCardTitle, IonCardContent, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!code() && !go()) {
      <ion-content>
        <div class="flexBox">
          <ion-card class="authCard">
            <ion-img
              [title]="'IDEA_AUTH.SERVICE_LOGO' | translate"
              [src]="darkMode ? 'assets/icons/icon-auth-alt.svg' : 'assets/icons/icon-auth.svg'"
            />
            @if (title) {
              <ion-card-header>
                <ion-card-title color="primary">{{ title }}</ion-card-title>
              </ion-card-header>
            }
            <ion-card-content>
              @if (identityProvider()) {
                <ion-button expand="block" [title]="'IDEA_AUTH.SIGN_IN_HINT' | translate" (click)="startLogin()">
                  {{ 'IDEA_AUTH.SIGN_IN' | translate }}
                </ion-button>
              } @else {
                <p testId="signin.error" class="errorBox">
                  <b>{{ 'IDEA_AUTH.UNKNOWN_PROVIDER' | translate }}.</b>
                </p>
              }
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    }
  `,
  styleUrls: ['auth.scss']
})
export class IDEAOktaPage {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _env = inject(IDEAEnvironment);

  identityProvider = signal<string>(null);
  code = signal<string>(null);
  go = signal<boolean>(false);

  domain = this._env.aws.cognito.domain;
  clientId = this._env.aws.cognito.userPoolClientId;
  redirectURI = `${window.location.origin}${window.location.pathname}`; // Cognito client must include this callback
  scope = 'email openid profile aws.cognito.signin.user.admin'; // Cognito client config must match

  title = this._env.idea.auth.title;
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  ionViewWillEnter(): void {
    this.identityProvider.set(this._route.snapshot.queryParamMap.get('provider'));
    this.code.set(this._route.snapshot.queryParamMap.get('code'));
    this.go.set(!!this._route.snapshot.queryParamMap.get('go'));
    this._router.navigate([], { queryParams: {}, replaceUrl: true });
    if (this.code()) this.endLogin();
    else if (this.identityProvider() && this.go()) this.startLogin();
  }

  startLogin(): void {
    const url = `https://${this.domain}/oauth2/authorize`;
    const params = new URLSearchParams();
    params.append('identity_provider', this.identityProvider());
    params.append('redirect_uri', this.redirectURI);
    params.append('response_type', 'code');
    params.append('client_id', this.clientId);
    params.append('scope', this.scope);

    window.location.assign(`${url}?${params.toString()}`);
  }

  private async endLogin(): Promise<void> {
    const url = `https://${this.domain}/oauth2/token`;
    const params = new URLSearchParams();
    params.append('code', this.code());
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', this.redirectURI);
    params.append('client_id', this.clientId);
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    const response = await fetch(url, { method: 'POST', headers, body: params.toString() });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const { id_token, access_token, refresh_token } = await response.json();

    storeCognitoSession(id_token, access_token, refresh_token);
    window.location.assign('');
  }
}
