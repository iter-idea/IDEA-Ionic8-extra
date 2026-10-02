import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { IDEAAppStatusService } from './appStatus.service';

/**
 * Keep the app on its status page while it's in maintenance or must be updated: any navigation becomes one to
 * `app-status`, which remembers where the user was going and takes them back there when it's over. It reads the status
 * already known: no request per navigation.
 *
 * Only for a native app that may force an update: the API is open, and nothing else keeps an old version out (the
 * app's own navigation at start-up, the back button). A web app doesn't need it: it always runs its latest version,
 * and during a maintenance whoever gets around the status page goes back there when the API refuses their requests
 * (idea-aws ≥ 4.8.0, with `APP_STATUS_URL`).
 *
 * Put it on every route but `app-status` itself, after the app's initialization guard:
 * `canActivate: [initGuard, ideaAppStatusGuard, authGuard]`. It only reads the status, and the redirection is the
 * router's, never a navigation of its own: it can't end up waiting for the app's start-up, nor the start-up for it.
 *
 * Not for an app that reads its status through the API (`check({ viaApi: true })`): the guard may read before
 * `check()` does, and it would read the asset, keeping that status until the next refresh.
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
