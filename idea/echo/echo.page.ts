import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';

// from idea-config.js
declare const IDEA_AWS_COGNITO_WEB_CLIENT_ID: string;
declare const IDEA_API_URL: string;

@Component({
  selector: 'idea-echo',
  templateUrl: 'echo.page.html',
  styleUrls: ['echo.page.scss']
})
export class IDEAEchoPage {
  public content: string;
  public success: boolean;

  constructor(
    public navCtrl: NavController,
    public activatedRoute: ActivatedRoute,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {}
  public ngOnInit() {
    const request: EchoRequests = this.activatedRoute.snapshot.queryParams.request;
    const code: string = this.activatedRoute.snapshot.queryParams.code;
    const user: string = decodeURIComponent(this.activatedRoute.snapshot.queryParams.user);
    switch (request) {
      case EchoRequests.REGISTRATION:
        this.followRegistrationLink(code, user);
        break;
      case EchoRequests.INVITATION:
        this.followInvitationLink(code);
        break;
      case EchoRequests.EMAIL_CHANGE:
        this.followEmailChangeConfirmationLink(code);
        break;
      default:
        this.navCtrl.navigateRoot(['/']);
        break;
    }
  }

  /**
   * Follow a registration link, to confirm a user account.
   * Note: uses Cognito's domain.
   */
  public followRegistrationLink(code: string, user: string) {
    this.loading.show();
    this.API.http
      .post(`${IDEA_API_URL}/cognito2`, {
        action: 'CONFIRM_SIGN_UP',
        username: user,
        confirmationCode: code,
        cognitoUserPoolClientId: IDEA_AWS_COGNITO_WEB_CLIENT_ID
      })
      .toPromise()
      .then(() => {
        this.success = true;
        this.content = this.t.instant('IDEA.ECHO.ACCOUNT_CONFIRMED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t.instant('IDEA.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
  /**
   * Follow an invitation link, to join a team.
   */
  public followInvitationLink(code: string) {
    this.loading.show();
    this.API.getResource('invitations', { resourceId: code })
      .then(() => {
        this.success = true;
        this.content = this.t.instant('IDEA.ECHO.TEAM_JOINED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t.instant('IDEA.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
  /**
   * Follow an email change link, to confirm the new email address.
   */
  public followEmailChangeConfirmationLink(code: string) {
    this.loading.show();
    this.API.getResource('emailChangeRequests', { resourceId: code })
      .then(() => {
        this.success = true;
        this.content = this.t.instant('IDEA.ECHO.EMAIL_CHANGED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t.instant('IDEA.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
}

export enum EchoRequests {
  REGISTRATION = 'registration',
  INVITATION = 'invitation',
  EMAIL_CHANGE = 'email-change'
}
