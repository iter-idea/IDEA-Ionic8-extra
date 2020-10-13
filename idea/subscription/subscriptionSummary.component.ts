import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAOfflineService } from '../offline/offline.service';

import { IDEASubscriptionComponent } from './subscription.component';

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'idea-subscription-summary',
  templateUrl: 'subscriptionSummary.component.html',
  styleUrls: ['subscriptionSummary.component.scss']
})
export class IDEASubscriptionSummaryComponent {
  /**
   * The target of the subscription, to decide which plans to load.
   */
  @Input() public target: IdeaX.ProjectPlanTargets;
  /**
   * Whether the current user has enough permissions to manage this subscription.
   */
  @Input() public userCanManage: boolean;
  /**
   * A general description for the plans.
   */
  @Input() public generalDescription: string;
  /**
   * The id of the existing/future subscription, based on the target.
   */
  public subscriptionId: string;
  /**
   * The subscription to manage (if any).
   */
  public subscription: IdeaX.ProjectSubscription;
  /**
   * The current membership.
   */
  public membership: IdeaX.Membership;
  /**
   * The plan subscribed.
   */
  public plan: IdeaX.ProjectPlan;
  /**
   * A shortcut to use Moment in UI.
   */
  public Moment = Moment;
  /**
   * Whether the UI is ready or not to show.
   */
  public ready: boolean;

  constructor(
    public platform: Platform,
    public changeRef: ChangeDetectorRef,
    public modalCtrl: ModalController,
    public offline: IDEAOfflineService,
    public message: IDEAMessageService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.ready = false;
    this.membership = this.tc.get('membership');
    Moment.locale(this.t.getCurrentLang());
    // define target and subscription id
    this.target = this.target || IdeaX.ProjectPlanTargets.TEAMS;
    if (this.target === IdeaX.ProjectPlanTargets.TEAMS) this.subscriptionId = this.membership.teamId;
    else this.subscriptionId = this.membership.userId;
    // acquire the subscription of the team
    this.ready = false;
    this.API.getResource(`projects/${IDEA_PROJECT}/subscriptions`, { idea: true, resourceId: this.subscriptionId })
      .then((subscription: IdeaX.ProjectSubscription) => {
        this.subscription = new IdeaX.ProjectSubscription(subscription);
        // acquire the subscribed plan, to display basic information
        this.API.getResource(`projects/${IDEA_PROJECT}/plans`, { idea: true, resourceId: this.subscription.planId })
          .then((plan: IdeaX.ProjectPlan) => {
            this.plan = new IdeaX.ProjectPlan(plan, this.t.languages());
            this.ready = true;
            this.changeRef.detectChanges();
          })
          .catch(() => this.message.error('IDEA.SUBSCRIPTION.COULDNT_LOAD_PLANS'));
      })
      // the team doesn't have a subscription
      .catch(() => {
        this.ready = true;
        this.changeRef.detectChanges();
      });
  }

  /**
   * Whether we can change the subscription or not, based on current plan and platform.
   */
  public canChange(): boolean {
    const platformStore = this.platform.is('ios') ? 'ios' : this.platform.is('android') ? 'android' : 'web';
    return (
      // if there is internet connection
      this.offline.isOnline() &&
      // if the current user is allowed (external permissions)
      this.userCanManage &&
      // if no subscription is set, the user can set it
      (!this.subscription ||
        // if the plan isn't managed with special rules
        (!this.plan.special &&
          // if it's the platform from which we subscribed
          platformStore === this.subscription.platform &&
          // whether the subscription is being managed by the manager
          this.subscription.managedByUser.userId === this.membership.userId))
    );
  }

  /**
   * Open the subscription manager.
   */
  public openSubscriptions() {
    if (this.canChange())
      this.modalCtrl
        .create({
          component: IDEASubscriptionComponent,
          componentProps: {
            subscription: this.subscription,
            target: this.target,
            generalDescription: this.generalDescription
          }
        })
        .then(modal => {
          // reload the updated situation on dismissal
          modal.onDidDismiss().then(() => this.ngOnInit());
          modal.present();
        });
  }

  /**
   * Whether the subscription is expired or no.
   * Note: when `validUntil` equals `0`, it means the subscription doesn't expire.
   */
  public isSubscriptionExpired(subscription: IdeaX.ProjectSubscription): boolean {
    return subscription && subscription.validUntil ? subscription.validUntil < Number(Moment().format('x')) : false;
  }

  /**
   * Get a label's value.
   */
  public getLabelValue(label: IdeaX.Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }
}
