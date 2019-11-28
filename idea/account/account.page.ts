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
  selector: 'account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss']
})
export class IDEAAccountPage {
  public user: IdeaX.User;
  public newEmail: string;
  public newPassword: string;
  public newPasswordConfirm: string;

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
    this.user = new IdeaX.User(this.tc.get('user'));
    this.newEmail = this.user.email;
  }

  /**
   * Prompt to edit the email of the user.
   */
  public updateEmail() {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.ACCOUNT.UPDATE_EMAIL'),
        subHeader: this.t.instant('IDEA.ACCOUNT.UPDATE_EMAIL_EXPLANATION'),
        inputs: [
          {
            name: 'pwd',
            type: 'password',
            placeholder: this.t.instant('IDEA.ACCOUNT.YOUR_CURRENT_PASSWORD')
          },
          {
            name: 'email',
            placeholder: this.t.instant('IDEA.ACCOUNT.NEW_EMAIL')
          }
        ],
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: data => {
              if (!data.email) {
                this.message.info('IDEA.ACCOUNT.INVALID_EMAIL');
                return;
              }
              this.loading.show();
              this.API.postResource('emailChangeRequests', {
                idea: true,
                body: { password: data.pwd, newEmail: data.email, project: IDEA_PROJECT }
              })
                .then(() => {
                  this.alertCtrl
                    .create({
                      header: this.t.instant('COMMON.OPERATION_COMPLETED'),
                      subHeader: this.t.instant('IDEA.ACCOUNT.UPDATE_EMAIL_FLOW_EXPLANATION'),
                      buttons: [{ text: this.t.instant('COMMON.GOT_IT') }]
                    })
                    .then(alert => alert.present());
                })
                .catch(() => this.message.error('IDEA.ACCOUNT.OPERATION_FAILED_PASSWORD'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Prompt to edit the password of the user.
   */
  public updatePassword() {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.ACCOUNT.UPDATE_PASSWORD'),
        inputs: [
          {
            name: 'old',
            type: 'password',
            placeholder: this.t.instant('IDEA.ACCOUNT.YOUR_CURRENT_PASSWORD')
          },
          {
            name: 'new',
            type: 'password',
            placeholder: this.t.instant('IDEA.ACCOUNT.NEW_PASSWORD_', { n: 8 })
          },
          {
            name: 'new2',
            type: 'password',
            placeholder: this.t.instant('IDEA.ACCOUNT.CONFIRM_NEW_PASSWORD')
          }
        ],
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: data => {
              if (data.new.length < 8)
                this.message.warning(this.t.instant('IDEA.ACCOUNT.INVALID_PASSWORD', { n: 8 }), true);
              else if (data.new !== data.new2) this.message.warning('IDEA.ACCOUNT.PASSWORD_CONFIRMATION_DONT_MATCH');
              else {
                // PATCH the user
                this.loading.show();
                this.API.patchResource('users', {
                  idea: true,
                  resourceId: this.user.userId,
                  body: {
                    action: 'UPDATE_PASSWORD',
                    password: data.old,
                    newPassword: data.new
                  }
                })
                  .then(() => this.message.success('IDEA.ACCOUNT.PASSWORD_UPDATED'))
                  .catch(() => this.message.error('IDEA.ACCOUNT.OPERATION_FAILED_PASSWORD'))
                  .finally(() => this.loading.hide());
              }
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Prompt to delete the user, after confirmation.
   */
  public deleteUser() {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.ACCOUNT.USER_DELETION'),
        subHeader: this.t.instant('IDEA.ACCOUNT.USER_DELETION_ARE_YOU_SURE'),
        inputs: [{ name: 'pwd', type: 'password', placeholder: this.t.instant('IDEA.ACCOUNT.YOUR_CURRENT_PASSWORD') }],
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: data => {
              // DELETE the user
              this.loading.show();
              this.API.deleteResource('users', {
                idea: true,
                resourceId: this.user.userId,
                headers: { password: data.pwd }
              })
                .then(() => window.location.assign(''))
                .catch(() => this.message.error('IDEA.ACCOUNT.OPERATION_FAILED_PASSWORD'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
}
