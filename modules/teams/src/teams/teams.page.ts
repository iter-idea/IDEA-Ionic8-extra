import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Team, User } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService
} from '@idea-ionic/common';

@Component({
  selector: 'teams',
  templateUrl: 'teams.page.html',
  styleUrls: ['teams.page.scss']
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
