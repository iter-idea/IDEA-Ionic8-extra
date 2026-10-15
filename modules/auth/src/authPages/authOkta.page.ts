import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, IonButton } from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { storeCognitoSession } from '../okta.helpers';
import { IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * The sign-in through an external provider (Okta) of Cognito's hosted UI: there and back with a code for the tokens.
 */
@Component({
  selector: 'idea-auth-okta',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      @if (!redirecting()) {
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.SIGN_IN' | translate }}</h1>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-actions">
          @if (identityProvider() && !notice()) {
            <ion-button class="idea-auth-button" expand="block" (click)="startLogin()">
              {{ 'IDEA_AUTH.SIGN_IN' | translate }}
            </ion-button>
          }
          <button type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
            {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
          </button>
        </div>
      }
    </idea-auth-shell>
  `
})
export class IDEAAuthOktaPage {
  private _env = inject(IDEAEnvironment);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);

  identityProvider = signal<string>(null);
  redirecting = signal(false);
  notice = signal<IDEAAuthNotice>(null);

  domain: string = this._env.aws.cognito.domain;
  clientId: string = this._env.aws.cognito.userPoolClientId;
  redirectURI = `${window.location.origin}${window.location.pathname}`; // Cognito client must include this callback
  scope = 'email openid profile aws.cognito.signin.user.admin'; // Cognito client config must match

  ionViewWillEnter(): void {
    const params = this._route.snapshot.queryParamMap;
    const code = params.get('code');
    const go = !!params.get('go');
    this.identityProvider.set(params.get('provider'));
    this.notice.set(code || this.identityProvider() ? null : { kind: 'error', message: 'IDEA_AUTH.UNKNOWN_PROVIDER' });
    this._router.navigate([], { queryParams: {}, replaceUrl: true });
    if (code) this.endLogin(code);
    else if (this.identityProvider() && go) this.startLogin();
  }

  startLogin(): void {
    this.redirecting.set(true);
    const params = new URLSearchParams();
    params.append('identity_provider', this.identityProvider());
    params.append('redirect_uri', this.redirectURI);
    params.append('response_type', 'code');
    params.append('client_id', this.clientId);
    params.append('scope', this.scope);
    window.location.assign(`https://${this.domain}/oauth2/authorize?${params.toString()}`);
  }

  private async endLogin(code: string): Promise<void> {
    this.redirecting.set(true);
    try {
      await this._loading.show();
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', this.redirectURI);
      params.append('client_id', this.clientId);
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      const response = await fetch(`https://${this.domain}/oauth2/token`, {
        method: 'POST',
        headers,
        body: params.toString()
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const { id_token, access_token, refresh_token } = await response.json();
      storeCognitoSession(id_token, access_token, refresh_token);
      window.location.assign('');
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.AUTHENTICATION_FAILED' });
      this.redirecting.set(false);
    } finally {
      this._loading.hide();
    }
  }

  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
