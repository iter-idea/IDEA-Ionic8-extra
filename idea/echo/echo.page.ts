import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';

// from idea-config.js
declare const IDEA_AWS_COGNITO_WEB_CLIENT_ID: string;
declare const IDEA_PROJECT: string;

@Component({
  selector: 'idea-echo',
  templateUrl: 'echo.page.html',
  styleUrls: ['echo.page.scss']
})
export class IDEAEchoPage {
  public content: string;
  public success: boolean;

  constructor(
    public tc: IDEATinCanService,
    public navCtrl: NavController,
    public activatedRoute: ActivatedRoute,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {}
  public ngOnInit() {
    const request: EchoRequests =
      this.activatedRoute.snapshot.paramMap.get('request') || this.activatedRoute.snapshot.queryParams.request;
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
      case EchoRequests.GITHUB_INTEGRATION:
        this.endGitHubIntegrationFlow(code === 'done');
        break;
      case EchoRequests.TRELLO_INTEGRATION:
        this.endTrelloIntegrationFlow(code);
        break;
      case EchoRequests.MICROSOFT_CALENDARS_INTEGRATION:
        alert('@todo');
        break;
      default:
        this.goHome();
        break;
    }
  }

  /**
   * Follow a registration link, to confirm a user account.
   * Note: uses Cognito's domain.
   */
  public followRegistrationLink(code: string, user: string) {
    this.loading.show();
    this.API.postResource('cognito2', {
      idea: true,
      body: {
        action: 'CONFIRM_SIGN_UP',
        username: user,
        confirmationCode: code,
        cognitoUserPoolClientId: IDEA_AWS_COGNITO_WEB_CLIENT_ID
      }
    })
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
    this.API.getResource('invitations', { idea: true, resourceId: code })
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
    this.API.getResource('emailChangeRequests', { idea: true, resourceId: code, params: { project: IDEA_PROJECT } })
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
  /**
   * Show the results of the integration of GitHub as a source.
   */
  public endGitHubIntegrationFlow(success: boolean) {
    this.success = success;
    this.content = success
      ? this.t.instant('IDEA.ECHO.GITHUB_SOURCE_INTEGRATION_SUCCESS')
      : this.t.instant('IDEA.ECHO.GITHUB_SOURCE_INTEGRATION_ERROR');
  }
  /**
   * Show the token to use for the integration of Trello as a source.
   */
  public endTrelloIntegrationFlow(token: string) {
    this.success = Boolean(token);
    this.content = token
      ? this.t.instant('IDEA.ECHO.TRELLO_SOURCE_INTEGRATION_SUCCESS', { token })
      : this.t.instant('IDEA.ECHO.TRELLO_SOURCE_INTEGRATION_ERROR');
  }

  /**
   * Return to the homepage.
   */
  public goHome() {
    this.navCtrl.navigateRoot(['/']);
  }
}

export enum EchoRequests {
  REGISTRATION = 'registration',
  INVITATION = 'invitation',
  EMAIL_CHANGE = 'email-change',
  GITHUB_INTEGRATION = 'github-integration',
  TRELLO_INTEGRATION = 'trello-integration',
  MICROSOFT_CALENDARS_INTEGRATION = 'microsoft-calendars-integration',
  GOOGLE_CALENDARS_INTEGRATION = 'google-calendars-integration'
}
