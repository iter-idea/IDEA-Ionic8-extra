import { Component } from '@angular/core';
import { AlertController, ActionSheetController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'memberships',
  templateUrl: 'memberships.page.html',
  styleUrls: ['memberships.page.scss']
})
export class IDEAMembershipsPage {
  public team: IdeaX.Team;
  public memberships: Array<IdeaX.Membership>;
  public membership: IdeaX.Membership;

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCanService,
    public route: ActivatedRoute,
    public actionSheetCtrl: ActionSheetController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {}
  public ngOnInit() {
    // load the team
    this.loading.show();
    this.API.getResource('teams', { idea: true, resourceId: this.route.snapshot.paramMap.get('teamId') })
      .then((team: IdeaX.Team) => {
        this.team = team;
        // load the user's membership as IDEA team
        this.API.getResource(`teams/${this.team.teamId}/memberships`, { idea: true })
          .then((memberships: Array<IdeaX.Membership>) => {
            this.memberships = memberships.map(m => {
              const membership = new IdeaX.Membership(m);
              // identify the user's membership
              if (membership.userId === this.tc.get('userId')) this.membership = membership;
              return membership;
            });
            this.loading.hide();
            // only admins can be here
            if (!this.membership || !this.membership.permissions.admin) {
              this.navCtrl.navigateBack(['teams']);
              this.message.error('IDEA.TEAMS.COULDNT_LOAD_LIST');
              return;
            }
          })
          .catch(() => this.loading.hide());
      })
      .catch(() => this.loading.hide());
  }
  /**
   * Whether the user is the owner of the team or not.
   */
  public isOwner(): boolean {
    return this.team && this.membership ? this.membership.userId === this.team.ownerId : false;
  }
  /**
   * Invite a new member in the team.
   */
  public addMember() {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.TEAMS.INVITE_USER'),
        inputs: [{ name: 'email', type: 'email', placeholder: this.t.instant('IDEA.TEAMS.EMAIL_TO_INVITE') }],
        buttons: [
          { text: this.t.instant('IDEA.TEAMS.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('IDEA.TEAMS.INVITE'),
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
    buttons.push({
      text: this.t.instant('IDEA.TEAMS.MANAGE_PERMISSIONS'),
      handler: () => this.editPermissionsMembership(membership)
    });
    buttons.push({
      text:
        membership.userId === this.tc.get('userId')
          ? this.t.instant('IDEA.TEAMS.UNJOIN')
          : this.t.instant('IDEA.TEAMS.KICK_OUT'),
      handler: () => this.deleteMembership(membership)
    });
    buttons.push({ text: this.t.instant('COMMON.CANCEL'), role: 'cancel' });
    this.actionSheetCtrl
      .create({ header: this.t.instant('IDEA.TEAMS.ACTIONS_ON_USER_', { user: membership.name }), buttons })
      .then(actions => actions.present());
  }
  /**
   * Edit the permissions of the team member.
   */
  private editPermissionsMembership(membership: IdeaX.Membership) {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.TEAMS.MANAGE_PERMISSIONS'),
        inputs: [
          {
            type: 'checkbox',
            label: this.t.instant('IDEA.TEAMS.CAN_MANAGE_TEAM'),
            value: 'admin',
            checked: membership.permissions.admin
          }
        ],
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: (perm: Array<string>) => {
              const permissions: any = { admin: perm.some(p => p === 'admin') };
              this.loading.show();
              this.API.patchResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                resourceId: membership.userId,
                body: {
                  action: 'CHANGE_PERMISSIONS',
                  permissions
                }
              })
                .then(() => {
                  membership.permissions.admin = permissions.admin;
                  this.message.success('COMMON.OPERATION_COMPLETED');
                })
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ],
        cssClass: 'alertLongOptions'
      })
      .then(alert => alert.present());
  }
  /**
   * Unjoin the team / remove the user from the IDEA team.
   */
  private deleteMembership(membership: IdeaX.Membership) {
    this.alertCtrl
      .create({
        header: this.t.instant('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: () => {
              this.loading.show();
              this.API.deleteResource(`teams/${this.team.teamId}/memberships`, {
                idea: true,
                resourceId: membership.userId
              })
                .then(() => {
                  if (this.tc.get('userId') === membership.userId) return window.location.assign('');
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
}
