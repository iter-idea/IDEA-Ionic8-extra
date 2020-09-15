import { Component } from '@angular/core';
import { AlertController, ActionSheetController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'memberships',
  templateUrl: 'memberships.page.html',
  styleUrls: ['memberships.page.scss']
})
export class IDEAMembershipsPage {
  /**
   * The current user.
   */
  public user: IdeaX.User;
  /**
   * The current team.
   */
  public team: IdeaX.Team;
  /**
   * The current membership-
   */
  public membership: IdeaX.Membership;
  /**
   * The current team's memberships;
   */
  public memberships: Array<IdeaX.Membership>;

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCanService,
    public route: ActivatedRoute,
    public actionSheetCtrl: ActionSheetController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.user = this.tc.get('user');
    // load the team (since it could be different from the current one)
    this.loading.show();
    this.API.getResource('teams', { idea: true, resourceId: this.route.snapshot.paramMap.get('teamId') })
      .then((team: IdeaX.Team) => {
        this.team = new IdeaX.Team(team);
        // load the user's membership as IDEA team
        this.API.getResource(`teams/${this.team.teamId}/memberships`, { idea: true })
          .then((memberships: Array<IdeaX.Membership>) => {
            this.memberships = memberships.map(m => {
              const membership = new IdeaX.Membership(m);
              // identify the user's membership
              if (membership.userId === this.user.userId) this.membership = membership;
              return membership;
            });
            this.loading.hide();
            // only admins can be here
            if (!this.membership || !this.team.isUserAdmin(this.membership)) {
              this.message.error('IDEA.TEAMS.COULDNT_LOAD_LIST');
              this.navCtrl.navigateBack(['teams']);
              return;
            }
          })
          .catch(() => {
            this.loading.hide();
            this.message.error('IDEA.TEAMS.COULDNT_LOAD_LIST');
          });
      })
      .catch(() => {
        this.loading.hide();
        this.message.error('IDEA.TEAMS.COULDNT_LOAD_LIST');
      });
  }
  /**
   * Invite a new member in the team.
   */
  public addMember() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA.TEAMS.INVITE_USER'),
        inputs: [{ name: 'email', type: 'email', placeholder: this.t._('IDEA.TEAMS.EMAIL_TO_INVITE') }],
        buttons: [
          { text: this.t._('IDEA.TEAMS.CANCEL'), role: 'cancel' },
          {
            text: this.t._('IDEA.TEAMS.INVITE'),
            handler: data => {
              if (!data.email) return;
              this.loading.show();
              this.API.postResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                body: { email: data.email, project: IDEA_PROJECT }
              })
                .then((membership: IdeaX.Membership) => {
                  // if the user was already part of the user pool, return the membership (otherwise it's an invitation)
                  if (membership && membership.userId) this.memberships.push(membership);
                  this.message.success('IDEA.TEAMS.INVITE_SENT');
                })
                .catch(() => this.message.error('IDEA.TEAMS.USER_NOT_FOUND_OR_ALREADY_JOINED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Actions on the membership.
   */
  public manageMembership(membership: IdeaX.Membership) {
    const buttons = [];
    // allow admin role removal only if there will be still at least one admin in the team
    if (!this.team.isUserAdmin(membership) || this.team.admins.length > 1)
      buttons.push({
        text: this.team.isUserAdmin(membership)
          ? this.t._('IDEA.TEAMS.REMOVE_ADMIN_ROLE')
          : this.t._('IDEA.TEAMS.MAKE_USER_ADMIN'),
        handler: () => this.toggleAdminRole(membership)
      });
    buttons.push({
      text: membership.userId === this.user.userId ? this.t._('IDEA.TEAMS.UNJOIN') : this.t._('IDEA.TEAMS.KICK_OUT'),
      handler: () => this.deleteMembership(membership)
    });
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA.TEAMS.ACTIONS_ON_USER_', { user: membership.name }), buttons })
      .then(actions => actions.present());
  }
  /**
   * Edit the permissions of the team member.
   */
  private toggleAdminRole(membership: IdeaX.Membership) {
    this.alertCtrl
      .create({
        header: this.team.isUserAdmin(membership)
          ? this.t._('IDEA.TEAMS.REMOVE_ADMIN_ROLE')
          : this.t._('IDEA.TEAMS.MAKE_USER_ADMIN'),
        message: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: () => {
              // request the change in the admin list
              this.loading.show();
              this.API.patchResource('teams', {
                idea: true,
                resourceId: this.team.teamId,
                body: {
                  action: this.team.isUserAdmin(membership) ? 'REMOVE_ADMIN' : 'ADD_ADMIN',
                  userId: membership.userId
                }
              })
                .then(() => {
                  // update the UI
                  if (!this.team.isUserAdmin(membership)) this.team.admins.push(membership.userId);
                  else
                    this.team.admins.splice(
                      this.team.admins.findIndex(a => a === membership.userId),
                      1
                    );
                  this.message.success('COMMON.OPERATION_COMPLETED');
                })
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Unjoin the team / remove the user from the IDEA team.
   */
  private deleteMembership(membership: IdeaX.Membership) {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: () => {
              this.loading.show();
              this.API.deleteResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                resourceId: membership.userId
              })
                .then(() => {
                  if (this.user.userId === membership.userId) return window.location.assign('');
                  this.message.success('IDEA.TEAMS.USER_REMOVED');
                  this.memberships.splice(this.memberships.indexOf(membership), 1);
                })
                .catch(() => this.message.error('IDEA.TEAMS.DELETION_OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
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
