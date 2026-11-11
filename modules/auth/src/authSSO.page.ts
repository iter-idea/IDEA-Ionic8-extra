import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, IonButton, IonContent } from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { getPKCEChallenge, startSSOFlow, storeCognitoSession, takeSSOFlow } from './sso.helpers';
import { IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * The sign-in through an external provider (SSO), whatever its protocol, on Cognito's hosted UI: there and back with a
 * code for the tokens, with `state` and PKCE.
 */
@Component({
  selector: 'idea-auth-sso',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content class="idea-auth">
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
    </ion-content>
  `
})
export class IDEAAuthSSOPage {
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
    const state = params.get('state');
    const go = !!params.get('go');
    const provider = params.get('provider');
    // a link can be around before its provider is on (e.g. the icon in a company's portal): it opens the app instead
    if (!code && provider && !this.isProviderOn(provider)) {
      this.redirecting.set(true);
      this._nav.navigateRoot(['']);
      return;
    }
    this.identityProvider.set(provider);
    this.notice.set(code || this.identityProvider() ? null : { kind: 'error', message: 'IDEA_AUTH.UNKNOWN_PROVIDER' });
    this._router.navigate([], { queryParams: {}, replaceUrl: true });
    if (code) this.endLogin(code, state);
    else if (this.identityProvider() && go) this.startLogin();
  }

  /**
   * An app that lists its providers signs in only through them.
   */
  private isProviderOn(provider: string): boolean {
    const providers: { name: string }[] = this._env.aws.cognito.externalProviders;
    return !providers || providers.some(p => p.name === provider);
  }

  async startLogin(): Promise<void> {
    this.redirecting.set(true);
    try {
      const flow = startSSOFlow();
      const params = new URLSearchParams();
      params.append('identity_provider', this.identityProvider());
      params.append('redirect_uri', this.redirectURI);
      params.append('response_type', 'code');
      params.append('client_id', this.clientId);
      params.append('scope', this.scope);
      params.append('state', flow.state);
      params.append('code_challenge', await getPKCEChallenge(flow.verifier));
      params.append('code_challenge_method', 'S256');
      window.location.assign(`https://${this.domain}/oauth2/authorize?${params.toString()}`);
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.AUTHENTICATION_FAILED' });
      this.redirecting.set(false);
    }
  }

  private async endLogin(code: string, state: string): Promise<void> {
    this.redirecting.set(true);
    // a code this tab didn't ask for (e.g. one planted by a link) signs nobody in
    const flow = takeSSOFlow();
    if (!flow || flow.state !== state) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.AUTHENTICATION_FAILED' });
      this.redirecting.set(false);
      return;
    }
    try {
      await this._loading.show();
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', this.redirectURI);
      params.append('client_id', this.clientId);
      params.append('code_verifier', flow.verifier);
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

/**
 * @deprecated the page serves every provider: use `IDEAAuthSSOPage`.
 */
export const IDEAAuthOktaPage = IDEAAuthSSOPage;
