import { Component } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Membership, Team, User } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEAActionSheetController,
  IDEATranslationsService
} from '@idea-ionic/common';

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
  public user: User;
  /**
   * The current team.
   */
  public team: Team;
  /**
   * The current membership-
   */
  public membership: Membership;
  /**
   * The current team's memberships;
   */
  public memberships: Membership[];

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCanService,
    public route: ActivatedRoute,
    public actionSheetCtrl: IDEAActionSheetController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public async ngOnInit() {
    this.user = this.tc.get('user');
    // load the team (since it could be different from the current one)
    await this.loading.show();
    this.API.getResource('teams', { idea: true, resourceId: this.route.snapshot.paramMap.get('teamId') })
      .then((team: Team) => {
        this.team = new Team(team);
        // load the user's membership as IDEA team
        this.API.getResource(`teams/${this.team.teamId}/memberships`, { idea: true })
          .then((memberships: Membership[]) => {
            this.memberships = memberships.map(m => {
              const membership = new Membership(m);
              // identify the user's membership
              if (membership.userId === this.user.userId) this.membership = membership;
              return membership;
            });
            this.loading.hide();
            // only admins can be here
            if (!this.membership || !this.team.isUserAdmin(this.membership)) {
              this.message.error('IDEA_TEAMS.TEAMS.COULDNT_LOAD_LIST');
              this.navCtrl.navigateBack(['teams']);
              return;
            }
          })
          .catch(() => {
            this.loading.hide();
            this.message.error('IDEA_TEAMS.TEAMS.COULDNT_LOAD_LIST');
          });
      })
      .catch(() => {
        this.loading.hide();
        this.message.error('IDEA_TEAMS.TEAMS.COULDNT_LOAD_LIST');
      });
  }
  /**
   * Invite a new member in the team.
   */
  public addMember() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_TEAMS.TEAMS.INVITE_USER'),
        inputs: [{ name: 'email', type: 'email', placeholder: this.t._('IDEA_TEAMS.TEAMS.EMAIL_TO_INVITE') }],
        buttons: [
          { text: this.t._('IDEA_TEAMS.TEAMS.CANCEL'), role: 'cancel' },
          {
            text: this.t._('IDEA_TEAMS.TEAMS.INVITE'),
            handler: async data => {
              if (!data.email) return;
              await this.loading.show();
              this.API.postResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                body: { email: data.email, project: IDEA_PROJECT }
              })
                .then((membership: Membership) => {
                  // if the user was already part of the user pool, return the membership (otherwise it's an invitation)
                  if (membership && membership.userId) this.memberships.push(membership);
                  this.message.success('IDEA_TEAMS.TEAMS.INVITE_SENT');
                })
                .catch(() => this.message.error('IDEA_TEAMS.TEAMS.USER_NOT_FOUND_OR_ALREADY_JOINED'))
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
  public manageMembership(membership: Membership) {
    const buttons = [];
    // allow admin role removal only if there will be still at least one admin in the team
    if (!this.team.isUserAdmin(membership) || this.team.admins.length > 1)
      buttons.push({
        text: this.team.isUserAdmin(membership)
          ? this.t._('IDEA_TEAMS.TEAMS.REMOVE_ADMIN_ROLE')
          : this.t._('IDEA_TEAMS.TEAMS.MAKE_USER_ADMIN'),
        icon: 'ribbon',
        handler: () => this.toggleAdminRole(membership)
      });
    buttons.push({
      text:
        membership.userId === this.user.userId
          ? this.t._('IDEA_TEAMS.TEAMS.UNJOIN')
          : this.t._('IDEA_TEAMS.TEAMS.KICK_OUT'),
      role: 'destructive',
      icon: 'exit',
      handler: () => this.deleteMembership(membership)
    });
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_TEAMS.TEAMS.ACTIONS_ON_USER_', { user: membership.name }), buttons })
      .then(actions => actions.present());
  }
  /**
   * Edit the permissions of the team member.
   */
  private toggleAdminRole(membership: Membership) {
    this.alertCtrl
      .create({
        header: this.team.isUserAdmin(membership)
          ? this.t._('IDEA_TEAMS.TEAMS.REMOVE_ADMIN_ROLE')
          : this.t._('IDEA_TEAMS.TEAMS.MAKE_USER_ADMIN'),
        message: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: async () => {
              // request the change in the admin list
              await this.loading.show();
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
  private deleteMembership(membership: Membership) {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: async () => {
              await this.loading.show();
              this.API.deleteResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                resourceId: membership.userId
              })
                .then(() => {
                  if (this.user.userId === membership.userId) return window.location.assign('');
                  this.message.success('IDEA_TEAMS.TEAMS.USER_REMOVED');
                  this.memberships.splice(this.memberships.indexOf(membership), 1);
                })
                .catch(() => this.message.error('IDEA_TEAMS.TEAMS.DELETION_OPERATION_FAILED'))
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
