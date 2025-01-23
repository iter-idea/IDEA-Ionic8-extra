import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'okta',
  standalone: true,
  imports: [IDEATranslatePipe, IonContent, IonCard, IonImg, IonCardHeader, IonCardTitle, IonCardContent, IonButton],
  template: `
    @if (!code && !go) {
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
              @if (identityProvider) {
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
  `
})
export class IDEAOktaPage {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _env = inject(IDEAEnvironment);

  identityProvider: string;
  code: string;
  go = false;

  domain = this._env.aws.cognito.domain;
  clientId = this._env.aws.cognito.userPoolClientId;
  redirectURI = `${window.location.origin}${window.location.pathname}`; // Cognito client must include this callback
  scope = 'email openid profile aws.cognito.signin.user.admin'; // Cognito client config must match

  title = this._env.idea.auth.title;
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  ionViewWillEnter(): void {
    this.identityProvider = this._route.snapshot.queryParamMap.get('provider');
    this.code = this._route.snapshot.queryParamMap.get('code');
    this.go = !!this._route.snapshot.queryParamMap.get('go');
    this._router.navigate([], { queryParams: {}, replaceUrl: true });
    if (this.code) this.endLogin();
    else if (this.identityProvider && this.go) this.startLogin();
  }

  startLogin(): void {
    const url = `https://${this.domain}/oauth2/authorize`;
    const params = new URLSearchParams();
    params.append('identity_provider', this.identityProvider);
    params.append('redirect_uri', this.redirectURI);
    params.append('response_type', 'code');
    params.append('client_id', this.clientId);
    params.append('scope', this.scope);

    window.location.assign(`${url}?${params.toString()}`);
  }

  private async endLogin(): Promise<void> {
    const url = `https://${this.domain}/oauth2/token`;
    const params = new URLSearchParams();
    params.append('code', this.code);
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

//
// HELPERS
//

/**
 * Store the tokens and the info needed by Cognito's front-end lib to authenticate.
 */
const storeCognitoSession = (idToken: string, accessToken: string, refreshToken: string): void => {
  const { sub } = decodeJWTToken(idToken);
  const { client_id } = decodeJWTToken(accessToken);
  const prefix = `CognitoIdentityServiceProvider.${client_id}`;
  window.localStorage.setItem(`${prefix}.LastAuthUser`, sub);
  window.localStorage.setItem(`${prefix}.${sub}.accessToken`, accessToken);
  window.localStorage.setItem(`${prefix}.${sub}.idToken`, idToken);
  window.localStorage.setItem(`${prefix}.${sub}.refreshToken`, refreshToken);
};

/**
 * Decode a JWT token and return its payload as a JSON object.
 */
const decodeJWTToken = (token: string): any => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
