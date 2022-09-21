import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { AuthGuard, AuthService } from '@auth0/auth0-angular';

import { IDEAApiService } from '@idea-ionic/common';

@Injectable({ providedIn: 'root' })
export class IDEAAuth0Guard extends AuthGuard {
  constructor(private auth0: AuthService, private api: IDEAApiService) {
    super(auth0);
  }

  private setApiAuthToken(): void {
    this.auth0.idTokenClaims$.subscribe(claims => (this.api.authToken = claims ? claims.__raw : null));
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    this.setApiAuthToken();
    return super.canLoad(route, segments);
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.setApiAuthToken();
    return super.canActivate(next, state);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.setApiAuthToken();
    return super.canActivateChild(childRoute, state);
  }
}
