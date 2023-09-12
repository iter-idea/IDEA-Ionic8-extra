import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { Auth0User } from 'idea-toolbox';

import { environment as env } from '@env';

@Injectable({ providedIn: 'root' })
export class IDEAAuth0Service {
  constructor(private platform: Platform, private auth0: AuthService) {}

  /**
   * The internal Auth0's service.
   */
  get __raw(): AuthService {
    return this.auth0;
  }

  private isMobileDevice(): boolean {
    return this.platform.is('capacitor');
  }

  /**
   * Open (if needed) Auth0's Universal Login page, to authenticate a user.
   * @param afterRedirectTo where to go after a successful login
   */
  goToLogin(afterRedirectTo?: string): void {
    this.isMobileDevice() ? this.loginWithMobile(afterRedirectTo) : this.loginWithSPA(afterRedirectTo);
  }
  private async loginWithSPA(afterRedirectTo?: string): Promise<void> {
    await firstValueFrom(this.auth0.loginWithRedirect({ appState: { target: afterRedirectTo } }));
  }
  private async loginWithMobile(afterRedirectTo?: string): Promise<void> {
    await firstValueFrom(
      this.auth0.loginWithRedirect({ appState: { target: afterRedirectTo }, openUrl: url => Browser.open({ url }) })
    );
  }

  /**
   * Open (if needed) Auth0's Universal Login page, to logout a user.
   */
  goToLogout(): void {
    this.isMobileDevice() ? this.logoutWithMobile() : this.logoutWithSPA();
  }
  private async logoutWithSPA(): Promise<void> {
    await firstValueFrom(this.auth0.logout({ logoutParams: { returnTo: document.location.origin } }));
  }
  private async logoutWithMobile(): Promise<void> {
    await firstValueFrom(
      this.auth0.logout({ logoutParams: { localOnly: true }, openUrl: url => Browser.open({ url }) })
    );
  }

  /**
   * Handle the callback after a login or logout in Auth0 Universal Login page.
   * In order to work, it has to be used in `app.component.ts`, as explained in the following snippet:
   * ```
      export class AppComponent {
        constructor(private ngZone: NgZone, private auth0: IDEAAuth0Service) {
          App.addListener('appUrlOpen', ({ url }): void =>
            this.ngZone.run((): void => this.auth0.handleCallbackOnMobileDevices(url))
          );
        }
      }
   * ```
   */
  async handleCallbackOnMobileDevices(url: string): Promise<void> {
    if (url?.startsWith(env.auth0.callbackUri)) {
      if (url.includes('state=') && (url.includes('error=') || url.includes('code=')))
        await firstValueFrom(this.auth0.handleRedirectCallback(url));
      await Browser.close();
    }
  }

  /**
   * Get the ID token, to use for authenticating API requests to the back-end.
   */
  async getIdToken(): Promise<string> {
    const { __raw } = await firstValueFrom(this.auth0.idTokenClaims$);
    return __raw;
  }
  /**
   * Whether the user is currently authenticated.
   */
  async isUserAuthenticated(): Promise<boolean> {
    return await firstValueFrom(this.auth0.isAuthenticated$);
  }
  /**
   * Get the current user and its data.
   */
  async getUser(): Promise<Auth0User> {
    const user = await firstValueFrom(this.auth0.user$);
    if (user) return new Auth0User(user);
    else return null;
  }
}
