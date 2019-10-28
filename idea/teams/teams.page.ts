import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';

import IdeaX = require('idea-toolbox');

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'teams',
  templateUrl: 'teams.page.html',
  styleUrls: ['teams.page.scss']
})
export class IDEATeamsPage {
  public teams: Array<IdeaX.Team>;

  constructor(
    public tc: IDEATinCanService,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {}
  public ngOnInit() {
    this.loadTeams();
  }

  /**
   * Load the user's teams.
   */
  public loadTeams() {
    this.loading.show();
    // get all the teams joined by the user
    this.API.getResource('teams', { idea: true, params: { project: IDEA_PROJECT } })
      .then((teams: Array<IdeaX.Team>) => (this.teams = teams))
      .catch(() => this.navCtrl.navigateRoot(['auth']))
      .finally(() => this.loading.hide());
  }

  /**
   * Change the currently selected team.
   */
  public selectTeam(teamId: string) {
    if (this.isCurrentTeam(teamId)) return this.navCtrl.navigateBack(['teams', teamId]);
    // request a team change (so that the `currentTeamId` of the user is updated)
    this.loading.show();
    this.API.patchResource('users', {
      idea: true,
      resourceId: this.tc.get('userId'),
      body: {
        action: 'CHANGE_TEAM',
        teamId,
        project: IDEA_PROJECT
      }
    })
      .then(() => window.location.assign('')) // reload the app so that it takes the new settings and permissions
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  /**
   * Check whether a team is the currently selected one or not.
   */
  public isCurrentTeam(teamId: string): boolean {
    return this.tc.get('user').currentTeamId === teamId;
  }

  /**
   * Create a new team.
   */
  public newTeam() {
    // ask for the name of the new team
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.TEAMS.NEW_TEAM'),
        subHeader: this.t.instant('IDEA.TEAMS.SELECT_NAME_FOR_NEW_TEAM'),
        inputs: [{ name: 'name', placeholder: this.t.instant('IDEA.TEAMS.TEAM_NAME') }],
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: data => {
              if (!data.name) return;
              // create a new team and add it to the teams list
              this.loading.show();
              this.API.postResource('teams', { idea: true, body: { name: data.name, project: IDEA_PROJECT } })
                .then(() => this.loadTeams())
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Open the team memberships configuration page.
   */
  public manageTeam(teamId: string, event?: any) {
    // stop the event propagation, to avoid the "click" on the main item
    if (event) event.stopPropagation();
    this.navCtrl.navigateForward(['teams', teamId, 'users']);
  }
}
