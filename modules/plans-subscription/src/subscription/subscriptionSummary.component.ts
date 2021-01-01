import { Component, Input, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';

import {
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService,
  IDEAOfflineService
} from '@idea-ionic/common';
import { Label, Membership, ProjectPlan, ProjectPlanTargets, ProjectSubscription } from 'idea-toolbox';

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
  @Input() public target: ProjectPlanTargets;
  /**
   * Whether the current user has enough permissions to manage this subscription.
   */
  @Input() public userCanManage: boolean;
  /**
   * A general description for the plans.
   */
  @Input() public generalDescription: string;
  /**
   * A timestamp to indicate (when it changes) if we should reload the subscription because it was updated.
   */
  @Input() public shouldUpdate: number;
  /**
   * The id of the existing/future subscription, based on the target.
   */
  public subscriptionId: string;
  /**
   * The subscription to manage (if any).
   */
  public subscription: ProjectSubscription;
  /**
   * The current membership.
   */
  public membership: Membership;
  /**
   * The plan subscribed.
   */
  public plan: ProjectPlan;
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
    // define target and subscription id
    this.target = this.target || ProjectPlanTargets.TEAMS;
    if (this.target === ProjectPlanTargets.TEAMS) this.subscriptionId = this.membership.teamId;
    else this.subscriptionId = this.membership.userId;
    // load the subscription
    this.loadSubscription();
  }
  public ngOnChanges(changes: SimpleChanges) {
    // reload the subscription
    if (changes.shouldUpdate && changes.shouldUpdate.currentValue) this.loadSubscription();
  }
  /**
   * Load the updated subscription.
   */
  private loadSubscription() {
    // acquire the subscription of the team
    this.ready = false;
    this.API.getResource(`projects/${IDEA_PROJECT}/subscriptions`, { idea: true, resourceId: this.subscriptionId })
      .then((subscription: ProjectSubscription) => {
        this.subscription = new ProjectSubscription(subscription);
        // acquire the subscribed plan, to display basic information
        this.API.getResource(`projects/${IDEA_PROJECT}/plans`, { idea: true, resourceId: this.subscription.planId })
          .then((plan: ProjectPlan) => {
            this.plan = new ProjectPlan(plan, this.t.languages());
            this.ready = true;
            this.changeRef.detectChanges();
          })
          .catch(() => this.message.error('IDEA_PS.SUBSCRIPTION.COULDNT_LOAD_PLANS'));
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
  public isSubscriptionExpired(subscription: ProjectSubscription): boolean {
    return subscription && subscription.validUntil ? subscription.validUntil < Date.now() : false;
  }

  /**
   * Get a label's value.
   */
  public getLabelValue(label: Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }
}
