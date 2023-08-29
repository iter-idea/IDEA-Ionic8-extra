import { NgModule } from '@angular/core';
import { AuthModule } from '@auth0/auth0-angular';

import { IDEAAuth0Service } from './auth0.service';

import { environment as env } from '@env';

@NgModule({
  imports: [
    AuthModule.forRoot({
      domain: env.auth0.domain,
      clientId: env.auth0.clientId,
      useRefreshTokens: env.auth0.storeRefreshToken,
      cacheLocation: env.auth0.storeRefreshToken ? 'localstorage' : 'memory',
      authorizationParams: {
        redirect_uri: env.auth0.callbackUri
      }
    })
  ],
  providers: [IDEAAuth0Service]
})
export class IDEAAuth0Module {}
