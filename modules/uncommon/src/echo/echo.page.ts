import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonCardContent
} from '@ionic/angular/standalone';
import { ExternalCalendarSources, mdToHtml } from 'idea-toolbox';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';

@Component({
  selector: 'idea-echo',
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IonCardContent,
    IonIcon,
    IonCardTitle,
    IonCardHeader,
    IonImg,
    IonCard,
    IonContent
  ],
  template: `
    <ion-content>
      <div class="flexBox">
        <ion-card class="echoCard maxWidthContainer">
          <ion-img [src]="'assets/icons/icon-auth.svg'" />
          <ion-card-header>
            <ion-card-title>
              @if (success === true) {
                <ion-icon testId="echoSuccess" color="success" name="checkmark" />
              }
              @if (success === false) {
                <ion-icon testId="echoFailure" color="danger" name="close" />
              }
            </ion-card-title>
          </ion-card-header>
          <ion-card-content class="selectable">
            {{ content }}
            @if (htmlContent) {
              <div class="htmlContent" [innerHTML]="htmlContent"></div>
            }
            @if (success === false || success === true) {
              <p class="youCanCloseMe">
                <i>{{ 'IDEA_UNCOMMON.ECHO.YOU_CAN_CLOSE_THE_PAGE' | translate }}</i>
              </p>
            }
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .echoCard {
        min-width: 300px;
        padding: 30px 20px;
        text-align: center;
        ion-img {
          width: 80px;
          display: block;
          margin: 0 auto;
        }
        ion-icon {
          font-size: 1.8em;
        }
        ion-card-content {
          margin-bottom: 20px;
          font-size: 1.2em;
          p.youCanCloseMe {
            margin-top: 12px;
          }
        }
      }
    `
  ]
})
export class IDEAEchoPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _route = inject(ActivatedRoute);
  private _tc = inject(IDEATinCanService);
  private _loading = inject(IDEALoadingService);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);

  content: string;
  htmlContent: string;
  success: boolean;

  ngOnInit(): void {
    const request: EchoRequests =
      this._route.snapshot.paramMap.get('request') || this._route.snapshot.queryParams.request;
    const code: string = this._route.snapshot.queryParams.code;
    const user: string = decodeURIComponent(this._route.snapshot.queryParams.user);
    const state: string = this._route.snapshot.queryParams.state;
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
        this.content = this._translate._('IDEA_UNCOMMON.ECHO.INVALID_ACTION');
        break;
    }
  }

  maintenanceMode(): void {
    const announcement = this._tc.get('idea-announcement');
    if (announcement && announcement.content) this.htmlContent = mdToHtml(announcement.content);
  }

  async followRegistrationLink(code: string, user: string): Promise<void> {
    try {
      await this._loading.show();
      await this._API.postResource('cognito2', {
        idea: true,
        body: {
          action: 'CONFIRM_SIGN_UP',
          username: user,
          confirmationCode: code,
          cognitoUserPoolClientId: this._env.aws.cognito.userPoolClientId
        }
      });
      this.success = true;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.ACCOUNT_CONFIRMED');
    } catch (error) {
      this.success = false;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.REQUEST_FAILED');
    } finally {
      this._loading.hide();
    }
  }
  async followInvitationLink(code: string): Promise<void> {
    try {
      await this._loading.show();
      await this._API.getResource('invitations', { idea: true, resourceId: code });
      this.success = true;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.TEAM_JOINED');
    } catch (error) {
      this.success = false;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.REQUEST_FAILED');
    } finally {
      this._loading.hide();
    }
  }
  async followEmailChangeConfirmationLink(code: string): Promise<void> {
    try {
      await this._loading.show();
      await this._API.getResource('emailChangeRequests', {
        idea: true,
        resourceId: code,
        params: { project: this._env.idea.project }
      });
      this.success = true;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.EMAIL_CHANGED');
    } catch (error) {
      this.success = false;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.REQUEST_FAILED');
    } finally {
      this._loading.hide();
    }
  }
  endGitHubIntegrationFlow(success: boolean): void {
    this.success = success;
    this.content = success
      ? this._translate._('IDEA_UNCOMMON.ECHO.GITHUB_SOURCE_INTEGRATION_SUCCESS')
      : this._translate._('IDEA_UNCOMMON.ECHO.GITHUB_SOURCE_INTEGRATION_ERROR');
  }
  endTrelloIntegrationFlow(token: string): void {
    this.success = Boolean(token);
    this.content = token
      ? this._translate._('IDEA_UNCOMMON.ECHO.TRELLO_SOURCE_INTEGRATION_SUCCESS', { token })
      : this._translate._('IDEA_UNCOMMON.ECHO.TRELLO_SOURCE_INTEGRATION_ERROR');
  }
  async endExternalCalendarsIntegrationFlow(
    service: ExternalCalendarSources,
    code: string,
    calendarId: string
  ): Promise<void> {
    try {
      await this._loading.show();
      await this._API.patchResource('calendars', {
        idea: true,
        body: { action: 'SET_EXTERNAL_INTEGRATION', service, code, calendarId, project: this._env.idea.project }
      });
      this.success = true;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.EXTERNAL_CALENDARS_SOURCE_INTEGRATION_SUCCESS');
    } catch (error) {
      this.success = false;
      this.content = this._translate._('IDEA_UNCOMMON.ECHO.EXTERNAL_CALENDARS_SOURCE_INTEGRATION_ERROR');
    } finally {
      this._loading.hide();
    }
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
