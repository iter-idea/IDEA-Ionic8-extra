import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Platform } from '@ionic/angular';
import { IDEAApiService, IDEAStorageService } from '@idea-ionic/common';

import { IDEAAuth0Service } from './auth0.service';

import { environment as env } from '@env';

export const auth0Guard: CanActivateFn = async () => {
  const platform = inject(Platform);
  const storage = inject(IDEAStorageService);
  const api = inject(IDEAApiService);
  const auth = inject(IDEAAuth0Service);

  //
  // HELPERS
  //

  const doAuth = async (): Promise<void> => {
    auth.redirectIfUnauthenticated(env.auth0.callbackUri);
    auth.goToLogin();
    setApiAuthToken();
  };

  const setApiAuthToken = (): void => {
    auth.__raw.idTokenClaims$.subscribe(claims => (api.authToken = claims ? claims.__raw : null));
    if (!api.authToken) api.authToken = auth.getIdToken();
  };

  setApiAuthToken();
  if (auth.isUserAuthenticated()) return true;

  await platform.ready();
  await storage.ready();

  await doAuth();
};
