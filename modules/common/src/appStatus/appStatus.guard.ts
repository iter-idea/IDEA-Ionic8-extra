import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { IDEAAppStatusService } from './appStatus.service';

/**
 * Keep the app on its status page while it's in maintenance or must be updated: any navigation becomes one to
 * `app-status`, which remembers where the user was going and takes them back there when it's over.
 *
 * Put it on every route but `app-status` itself, after the app's initialization guard:
 * `canActivate: [initGuard, ideaAppStatusGuard, authGuard]`. It only reads the status, and the redirection is the
 * router's, never a navigation of its own: it can't end up waiting for the app's start-up, nor the start-up for it.
 */
export const ideaAppStatusGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
  const _appStatus = inject(IDEAAppStatusService);
  const _router = inject(Router);

  if (state.url.split(/[?#]/)[0].endsWith('/app-status')) return true;

  const appStatus = await _appStatus.load();
  if (!_appStatus.isBlocking(appStatus)) return true;

  _appStatus.returnURL ??= state.url;
  return _router.parseUrl('/app-status');
};
