import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, AuthClientConfig } from '@auth0/auth0-angular';
import { IDEAEnvironment } from '@idea-ionic/common';

const injectConfig = (env: any, config: AuthClientConfig): (() => void) => {
  return (): void =>
    config.set({
      domain: env.auth0.domain,
      clientId: env.auth0.clientId,
      useRefreshTokens: env.auth0.storeRefreshToken,
      cacheLocation: env.auth0.storeRefreshToken ? 'localstorage' : 'memory',
      authorizationParams: { redirect_uri: env.auth0.callbackUri || window.location.origin }
    });
};

@NgModule({
  imports: [AuthModule.forRoot()],
  providers: [
    { provide: APP_INITIALIZER, useFactory: injectConfig, deps: [IDEAEnvironment, AuthClientConfig], multi: true }
  ]
})
export class IDEAAuth0Module {}
