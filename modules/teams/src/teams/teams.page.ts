import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Team, User } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService
} from '@idea-ionic/common';

import { environment as env } from '@env/environment';

@Component({
  selector: 'teams',
  templateUrl: 'teams.page.html',
  styleUrls: ['teams.page.scss']
})
export class IDEATeamsPage implements OnInit {
  /**
   * The current user.
   */
  public user: User;
  /**
   * The teams available to the user.
   */
  public teams: Team[];
  /**
   * The current project.
   */
  public project = env.idea.project;

  constructor(
    public tc: IDEATinCanService,
    public navCtrl: NavController,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.user = this.tc.get('user');
    this.loadTeams();
  }

  /**
   * Load the user's teams.
   */
  public async loadTeams() {
    await this.loading.show();
    // get all the teams joined by the user
    this.API.getResource('teams', { idea: true, params: { project: this.project } })
      .then((teams: Team[]) => (this.teams = teams.map(t => new Team(t))))
      .catch(() => this.navCtrl.navigateRoot(['auth']))
      .finally(() => this.loading.hide());
  }

  /**
   * Change the currently selected team.
   */
  public async selectTeam(team: Team) {
    if (this.isCurrentTeam(team)) return this.navCtrl.navigateBack(['teams', team.teamId]);
    // request a team change (so that the current teamId of the user is updated)
    await this.loading.show();
    this.API.patchResource('users', {
      idea: true,
      resourceId: this.user.userId,
      body: { action: 'CHANGE_TEAM', teamId: team.teamId, project: this.project }
    })
      .then(() => window.location.assign(''))
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  /**
   * Whether a team is selected or not yet.
   */
  public aTeamIsSelected(): boolean {
    return Boolean(this.user.getCurrentTeamOfProject(this.project));
  }
  /**
   * Whether the team is active on the current project.
   */
  public teamIsActiveOnProject(team: Team): boolean {
    return team.activeInProjects.some(p => p === this.project);
  }
  /**
   * Check whether a team is the currently selected one or not.
   */
  public isCurrentTeam(team: Team): boolean {
    return this.user.getCurrentTeamOfProject(this.project) === team.teamId;
  }

  /**
   * Get the name of a project.
   */
  public getProjectName(project: string): string {
    return this.t._('IDEA_TEAMS.TEAMS.PROJECTS_NAMES.'.concat(project));
  }

  /**
   * Open IDEA account page.
   */
  public openAccount() {
    this.navCtrl.navigateForward(['account']);
  }

  /**
   * Close the page and navigate back, optionally displaying an error message.
   */
  public close(errorMessage?: string) {
    if (errorMessage) this.message.error(errorMessage);
    try {
      this.navCtrl.back();
    } catch (_) {
      this.navCtrl.navigateRoot(['']);
    }
  }
}
