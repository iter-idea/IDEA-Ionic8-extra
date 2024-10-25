import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  NavController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonLabel,
  IonItem,
  IonBadge
} from '@ionic/angular/standalone';
import { Team, User } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEALoadingService,
  IDEAMessageService,
  IDEATranslatePipe,
  IDEATranslationsService
} from '@idea-ionic/common';
import { IDEAAWSAPIService, IDEATinCanService } from '@idea-ionic/uncommon';

@Component({
  selector: 'teams',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IonBadge,
    IonItem,
    IonLabel,
    IonListHeader,
    IonList,
    IonContent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          @if (aTeamIsSelected()) {
            <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
              <ion-icon name="arrow-back" slot="icon-only" />
            </ion-button>
          }
        </ion-buttons>
        <ion-title>{{ 'IDEA_TEAMS.TEAMS.SELECT_A_TEAM' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button [title]="'IDEA_TEAMS.ACCOUNT.MANAGE_YOUR_ACCOUNT_HINT' | translate" (click)="openAccount()">
            <ion-icon name="person" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="full" class="aList maxWidthContainer">
        @if (!aTeamIsSelected()) {
          <ion-list-header>
            <ion-label class="ion-text-center">
              <h2>{{ 'IDEA_TEAMS.TEAMS.YOU_NEED_A_TEAM_TO_CONTINUE' | translate }}</h2>
            </ion-label>
          </ion-list-header>
        }
        @for (team of teams; track team) {
          <ion-item
            [title]="'IDEA_TEAMS.TEAMS.SELECT_TEAM_' | translate: { team: team.name }"
            [button]="true"
            [disabled]="!teamIsActiveOnProject(team)"
            (click)="selectTeam(team)"
          >
            <ion-label>
              <b>{{ team.name }}</b>
              @if (!teamIsActiveOnProject(team)) {
                <p>{{ 'IDEA_TEAMS.TEAMS.TEAM_NOT_ACTIVATED_DISCLAIMER' | translate }}</p>
              }
              @if (team.activeInProjects.length) {
                <p>
                  {{ 'IDEA_TEAMS.TEAMS.ACTIVE_ON' | translate }}:
                  @for (p of team.activeInProjects; track p) {
                    <ion-badge color="light" size="small"> {{ getProjectName(p) }} </ion-badge>
                  }
                </p>
              }
            </ion-label>
            @if (isCurrentTeam(team)) {
              <ion-badge slot="end" color="primary" [title]="'IDEA_TEAMS.TEAMS.CURRENT_TEAM_EXPLANATION' | translate">
                {{ 'IDEA_TEAMS.TEAMS.CURRENT' | translate }}
              </ion-badge>
            }
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .aList {
        ion-item ion-label p ion-badge {
          margin-top: 4px;
          vertical-align: bottom;
        }
      }
    `
  ]
})
export class IDEATeamsPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _tc = inject(IDEATinCanService);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);

  user: User;
  teams: Team[];
  project: string;

  ngOnInit(): void {
    this.project = this._env.idea.project;
    this.user = this._tc.get('user');
    this.loadTeams();
  }

  async loadTeams(): Promise<void> {
    try {
      await this._loading.show();
      const teams: Team[] = await this._API.getResource('teams', { idea: true, params: { project: this.project } });
      this.teams = teams.map(t => new Team(t));
    } catch (error) {
      this._nav.navigateRoot(['auth']);
    } finally {
      this._loading.hide();
    }
  }

  async selectTeam(team: Team): Promise<void> {
    try {
      await this._loading.show();
      await this._API.patchResource('users', {
        idea: true,
        resourceId: this.user.userId,
        body: { action: 'CHANGE_TEAM', teamId: team.teamId, project: this.project }
      });
      window.location.assign('');
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  aTeamIsSelected(): boolean {
    return Boolean(this.user.getCurrentTeamOfProject(this.project));
  }
  teamIsActiveOnProject(team: Team): boolean {
    return team.activeInProjects.some(p => p === this.project);
  }
  isCurrentTeam(team: Team): boolean {
    return this.user.getCurrentTeamOfProject(this.project) === team.teamId;
  }

  getProjectName(project: string): string {
    return this._translate._('IDEA_TEAMS.TEAMS.PROJECTS_NAMES.'.concat(project));
  }

  openAccount(): void {
    this._nav.navigateForward(['account']);
  }

  close(errorMessage?: string): void {
    if (errorMessage) this._message.error(errorMessage);
    try {
      this._nav.back();
    } catch (_) {
      this._nav.navigateRoot(['']);
    }
  }
}
