import { Component } from '@angular/core';
import { ActionSheetController, AlertController, NavController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'teams',
  templateUrl: 'teams.page.html',
  styleUrls: ['teams.page.scss']
})
export class IDEATeamsPage {
  /**
   * The current user.
   */
  public user: IdeaX.User;
  /**
   * The teams available to the user.
   */
  public teams: Array<IdeaX.Team>;
  /**
   * The current project.
   */
  public project = IDEA_PROJECT;

  constructor(
    public tc: IDEATinCanService,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
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
  public loadTeams() {
    this.loading.show();
    // get all the teams joined by the user
    this.API.getResource('teams', { idea: true, params: { project: this.project } })
      .then((teams: Array<IdeaX.Team>) => (this.teams = teams.map(t => new IdeaX.Team(t))))
      .catch(() => this.navCtrl.navigateRoot(['auth']))
      .finally(() => this.loading.hide());
  }

  /**
   * Change the currently selected team.
   */
  public selectTeam(team: IdeaX.Team, newTeam?: boolean) {
    if (this.isCurrentTeam(team)) return this.navCtrl.navigateBack(['teams', team.teamId]);
    // request a team change (so that the current teamId of the user is updated)
    this.loading.show();
    this.API.patchResource('users', {
      idea: true,
      resourceId: this.user.userId,
      body: { action: 'CHANGE_TEAM', teamId: team.teamId, project: this.project }
    })
      .then(() => {
        // redirect to team page if a new team has just been created, in order to complete its configuration
        if (newTeam) window.location.assign(`teams/${team.teamId}/settings?newTeam=true`);
        // reload the app so that it takes the new settings and permissions
        else window.location.assign('');
      })
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
  public teamIsActiveOnProject(team: IdeaX.Team): boolean {
    return team.activeInProjects.some(p => p === this.project);
  }
  /**
   * Check whether a team is the currently selected one or not.
   */
  public isCurrentTeam(team: IdeaX.Team): boolean {
    return this.user.getCurrentTeamOfProject(this.project) === team.teamId;
  }

  /**
   * Get the name of a project.
   */
  public getProjectName(project: string): string {
    return this.t._('IDEA.TEAMS.PROJECTS_NAMES.'.concat(project));
  }

  /**
   * Create a new team.
   */
  public newTeam() {
    // ask for the name of the new team
    this.alertCtrl
      .create({
        header: this.t._('IDEA.TEAMS.NEW_TEAM'),
        subHeader: this.t._('IDEA.TEAMS.SELECT_NAME_FOR_NEW_TEAM'),
        inputs: [{ name: 'name', placeholder: this.t._('IDEA.TEAMS.TEAM_NAME') }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: data => {
              if (!data.name) return;
              // create a new team and add it to the teams list
              this.loading.show();
              this.API.postResource('teams', { idea: true, body: { name: data.name, project: this.project } })
                // select the new team as current team
                .then((team: IdeaX.Team) => this.selectTeam(team, true))
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Actions on the team.
   */
  public manageTeam(team: IdeaX.Team, event?: any) {
    // stop the event propagation, to avoid the "click" on the main item
    if (event) event.stopPropagation();
    // prepare the options
    const buttons = [];
    buttons.push({
      text: this.t._('IDEA.TEAMS.MANAGE_TEAM_MEMBERS'),
      handler: () => this.navCtrl.navigateForward(['teams', team.teamId, 'users'])
    });
    buttons.push({ text: this.t._('IDEA.TEAMS.DELETE_TEAM'), role: 'danger', handler: () => this.deleteTeam(team) });
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel' });
    // show the options
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA.TEAMS.ACTIONS_ON_TEAM_', { team: team.name }), buttons })
      .then(actions => actions.present());
  }

  /**
   * Delete a team, if possible.
   */
  public deleteTeam(team: IdeaX.Team) {
    // be sure the team isn't active in any project
    if (team.activeInProjects.length) return this.message.error('IDEA.TEAMS.DEACTIVATE_FIRST_TEAM_FROM_PROJECTS');
    // request the password of the current user (admin) to proceed
    this.alertCtrl
      .create({
        header: this.t._('IDEA.TEAMS.DELETE_TEAM'),
        subHeader: this.t._('COMMON.ARE_YOU_SURE'),
        message: this.t._('IDEA.TEAMS.TEAM_DELETION_ARE_YOU_SURE'),
        inputs: [{ name: 'pwd', type: 'password', placeholder: this.t._('IDEA.TEAMS.YOUR_CURRENT_PASSWORD') }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
            handler: data => {
              // DELETE the team
              this.loading.show();
              this.API.deleteResource('teams', {
                idea: true,
                resourceId: team.teamId,
                headers: { password: data.pwd }
              })
                .then(() => window.location.assign(''))
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
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
