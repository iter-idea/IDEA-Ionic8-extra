import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ExternalCalendarSources, mdToHtml } from 'idea-toolbox';

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

import { environment as env } from '@env';

@Component({
  selector: 'idea-echo',
  templateUrl: 'echo.page.html',
  styleUrls: ['echo.page.scss']
})
export class IDEAEchoPage implements OnInit {
  /**
   * The message/content to show.
   */
  public content: string;
  /**
   * The message/content to show, in HTML (alternative to `content`).
   */
  public htmlContent: string;
  /**
   * Whether a request was successful or not.
   */
  public success: boolean;

  constructor(
    public tc: IDEATinCanService,
    public navCtrl: NavController,
    public activatedRoute: ActivatedRoute,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    const request: EchoRequests =
      this.activatedRoute.snapshot.paramMap.get('request') || this.activatedRoute.snapshot.queryParams.request;
    const code: string = this.activatedRoute.snapshot.queryParams.code;
    const user: string = decodeURIComponent(this.activatedRoute.snapshot.queryParams.user);
    const state: string = this.activatedRoute.snapshot.queryParams.state;
    switch (request) {
      case EchoRequests.MAINTENANCE:
        this.maintenanceMode();
        break;
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
        this.endExternalCalendarsIntegrationFlow(ExternalCalendarSources.MICROSOFT, code, state);
        break;
      case EchoRequests.GOOGLE_CALENDARS_INTEGRATION:
        this.endExternalCalendarsIntegrationFlow(ExternalCalendarSources.GOOGLE, code, state);
        break;
      default:
        this.success = false;
        this.content = this.t._('IDEA_COMMON.ECHO.INVALID_ACTION');
        break;
    }
  }

  /**
   * Show a message to notify users that the service is in maintenance mode.
   */
  public maintenanceMode() {
    const announcement = this.tc.get('idea-announcement');
    if (announcement && announcement.content) this.htmlContent = mdToHtml(announcement.content);
  }

  /**
   * Follow a registration link, to confirm a user account.
   * Note: uses Cognito's domain.
   */
  public async followRegistrationLink(code: string, user: string) {
    await this.loading.show();
    this.API.postResource('cognito2', {
      idea: true,
      body: {
        action: 'CONFIRM_SIGN_UP',
        username: user,
        confirmationCode: code,
        cognitoUserPoolClientId: env.aws.cognito.userPoolClientId
      }
    })
      .then(() => {
        this.success = true;
        this.content = this.t._('IDEA_COMMON.ECHO.ACCOUNT_CONFIRMED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t._('IDEA_COMMON.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
  /**
   * Follow an invitation link, to join a team.
   */
  public async followInvitationLink(code: string) {
    await this.loading.show();
    this.API.getResource('invitations', { idea: true, resourceId: code })
      .then(() => {
        this.success = true;
        this.content = this.t._('IDEA_COMMON.ECHO.TEAM_JOINED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t._('IDEA_COMMON.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
  /**
   * Follow an email change link, to confirm the new email address.
   */
  public async followEmailChangeConfirmationLink(code: string) {
    await this.loading.show();
    this.API.getResource('emailChangeRequests', { idea: true, resourceId: code, params: { project: env.idea.project } })
      .then(() => {
        this.success = true;
        this.content = this.t._('IDEA_COMMON.ECHO.EMAIL_CHANGED');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t._('IDEA_COMMON.ECHO.REQUEST_FAILED');
      })
      .finally(() => this.loading.hide());
  }
  /**
   * Show the results of the integration of GitHub as a source.
   */
  public endGitHubIntegrationFlow(success: boolean) {
    this.success = success;
    this.content = success
      ? this.t._('IDEA_COMMON.ECHO.GITHUB_SOURCE_INTEGRATION_SUCCESS')
      : this.t._('IDEA_COMMON.ECHO.GITHUB_SOURCE_INTEGRATION_ERROR');
  }
  /**
   * Show the token to use for the integration of Trello as a source.
   */
  public endTrelloIntegrationFlow(token: string) {
    this.success = Boolean(token);
    this.content = token
      ? this.t._('IDEA_COMMON.ECHO.TRELLO_SOURCE_INTEGRATION_SUCCESS', { token })
      : this.t._('IDEA_COMMON.ECHO.TRELLO_SOURCE_INTEGRATION_ERROR');
  }
  /**
   * Complete the integration with external calendars (Google, Microsoft, ecc.).
   */
  public async endExternalCalendarsIntegrationFlow(service: ExternalCalendarSources, code: string, calendarId: string) {
    await this.loading.show();
    this.API.patchResource('calendars', {
      idea: true,
      body: { action: 'SET_EXTERNAL_INTEGRATION', service, code, calendarId, project: env.idea.project }
    })
      .then(() => {
        this.success = true;
        this.content = this.t._('IDEA_COMMON.ECHO.EXTERNAL_CALENDARS_SOURCE_INTEGRATION_SUCCESS');
      })
      .catch(() => {
        this.success = false;
        this.content = this.t._('IDEA_COMMON.ECHO.EXTERNAL_CALENDARS_SOURCE_INTEGRATION_ERROR');
      })
      .finally(() => this.loading.hide());
  }
}

export enum EchoRequests {
  MAINTENANCE = 'maintenance',
  REGISTRATION = 'registration',
  INVITATION = 'invitation',
  EMAIL_CHANGE = 'email-change',
  GITHUB_INTEGRATION = 'github-integration',
  TRELLO_INTEGRATION = 'trello-integration',
  MICROSOFT_CALENDARS_INTEGRATION = 'microsoft-calendars-integration',
  GOOGLE_CALENDARS_INTEGRATION = 'google-calendars-integration'
}
