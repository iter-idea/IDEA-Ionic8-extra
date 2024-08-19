import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IDEAApiService } from '@idea-ionic/common';

import { IDEAAuth0Service } from './auth0.service';

export const auth0Guard: CanActivateFn = async (
  _: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean> => {
  const _auth = inject(IDEAAuth0Service);
  const _api = inject(IDEAApiService);

  if (!_api.authToken)
    _api.authToken = async (): Promise<string> => {
      try {
        return getValidIdToken(_auth);
      } catch (error) {
        _auth.goToLogin(state.url);
        return null;
      }
    };

  if (await _auth.isUserAuthenticated()) return true;
  else {
    _auth.goToLogin(state.url);
    return false;
  }
};

/**
 * Get a valid ID token from the cache or, if expired, from the server.
 * Note: Auth0 consider the cache valid even if the ID Token expried (only checks for valid Access Tokens).
 */
const getValidIdToken = async (auth: IDEAAuth0Service): Promise<string> => {
  const cacheRes = await firstValueFrom(auth.__raw.getAccessTokenSilently({ detailedResponse: true }));

  const { exp } = decodeJwt(cacheRes.id_token);
  const isTokenExpired = new Date(exp * 1000) < new Date();

  if (!isTokenExpired) return cacheRes.id_token;
  else {
    const freshRes = await firstValueFrom(
      auth.__raw.getAccessTokenSilently({ detailedResponse: true, cacheMode: 'off' })
    );
    return freshRes.id_token;
  }
};

/**
 * Decode a JWT without relying on external libraries.
 */
const decodeJwt = (token: string): Record<string, any> => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};
