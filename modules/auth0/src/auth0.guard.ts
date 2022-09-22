import { Injectable } from '@angular/core';
import { RouterStateSnapshot, CanActivate, CanLoad, CanActivateChild, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { IDEAApiService } from '@idea-ionic/common';

import { IDEAAuth0Service } from './auth0.service';

@Injectable({ providedIn: 'root' })
export class IDEAAuth0Guard implements CanActivate, CanLoad, CanActivateChild {
  constructor(private auth0: IDEAAuth0Service, private api: IDEAApiService) {}
  private setApiAuthToken(): void {
    this.auth0.__raw.idTokenClaims$.subscribe(claims => (this.api.authToken = claims ? claims.__raw : null));
  }

  canLoad(): Observable<boolean> {
    this.setApiAuthToken();
    return this.auth0.__raw.isAuthenticated$.pipe(take(1));
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.setApiAuthToken();
    return this.auth0.redirectIfUnauthenticated(state.url);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.setApiAuthToken();
    return this.auth0.redirectIfUnauthenticated(state.url);
  }
}
