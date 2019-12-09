import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { ModalController, Platform, AlertController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { InAppPurchase2, IAPProduct } from '@ionic-native/in-app-purchase-2/ngx';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEAExtBrowserService } from '../extBrowser.service';

import { IDEAStripeSubscriptionComponent } from './stripeSubscription.component';

// from idea-config.js
declare const IDEA_PROJECT: string;

@Component({
  selector: 'subscription',
  templateUrl: 'subscription.component.html',
  styleUrls: ['subscription.component.scss']
})
export class IDEASubscriptionComponent {
  @Input() public target: string;
  public platformStore: string;
  public plans: Array<IdeaX.ProjectPlan>;
  public subscription: IdeaX.ProjectSubscription;

  /**
   * Support object for subscriptions' limits checks.
   */
  public ProjectPlanTargets = IdeaX.ProjectPlanTargets;

  // callbacks store (defined here so we can turn them off when the component is destroyed)
  protected cbStoreOnReady: any;
  protected cbStoreOnError: any;
  protected cbStoreOnProductApproved: any;
  protected cbStoreOnProductVerified: any;
  protected cbStoreOnProductFinished: any;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public changeRef: ChangeDetectorRef,
    public tc: IDEATinCanService,
    public extBrowser: IDEAExtBrowserService,
    public store: InAppPurchase2,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {}
  public ngOnInit() {
    Moment.locale(this.t.currentLang);
    // load the plans only if we are on the same platform from which we subscribed first
    this.platformStore = this.platform.is('ios') ? 'ios' : this.platform.is('android') ? 'android' : 'web';
    // identify the current subscription according to the target: TEAMS or USERS
    this.subscription =
      this.target === IdeaX.ProjectPlanTargets.TEAMS
        ? this.tc.get('team').subscription || null
        : this.target === IdeaX.ProjectPlanTargets.USERS
        ? this.tc.get('user').subscription || null
        : null;
    // get the subscription platform and check if this matches with the current platform
    const platformSubscription = this.subscription ? this.subscription.platform : null;
    if (platformSubscription && platformSubscription !== this.platformStore) this.close();
    else {
      // load the plans allowed on this platform
      this.loading.show();
      this.API.getResource(`projects/${IDEA_PROJECT}/plans`, {
        idea: true,
        params: { platform: this.platformStore, target: this.target }
      })
        .then((plans: Array<IdeaX.ProjectPlan>) => {
          this.plans = plans;
          // if we are on ios/android, integrate the plans with the store info
          if (this.platform.is('ios') || this.platform.is('android')) {
            // register the products to get their info from the store
            // note: the plugin save the products in the local storage: don't load the same resources twice
            if (!this.store.products.length)
              this.store.register(this.plans.map(s => ({ id: s.storePlanId, type: this.store.PAID_SUBSCRIPTION })));
            // prepare the store mechanisms
            this.prepareStore();
            // run the store refresh (throws store.ready)
            this.store.refresh();
            this.loading.hide();
          } else this.loading.hide();
        })
        .catch(() => {
          this.loading.hide();
          this.message.error('IDEA.SUBSCRIPTION.COULDNT_LOAD_PLANS');
          this.close();
        });
    }
  }
  public ngOnDestroy() {
    this.dismissStore();
  }

  /**
   * Manage the store mechanisms.
   */
  private prepareStore() {
    // set the server validation for any paid plan (special query)
    this.store.validator = (p: IAPProduct, cb: any) => {
      // request a validation (Store <-> IDEA's API)
      this.API.patchResource('users', {
        idea: true,
        resourceId: this.tc.get('user').userId,
        body: { action: 'VERIFY_STORE_SUBSCRIPTION', transaction: p.transaction, storePlanId: p.id }
      })
        .then((subscription: IdeaX.ProjectSubscription) => {
          this.tc.get('user').subscription = subscription;
          // to avoid multiple verifications (iOS)
          const plan = this.plans.find(x => x.planId === subscription.planId);
          if (plan && p.id === plan.storePlanId) cb(true);
          else {
            p.state = this.store.VALID;
            cb(false);
          }
        })
        .catch(err => {
          // if the error is due to a cancellation, force the product state to VALID to avoid other verifications
          if (['E.USERS.SUBSCRIPTION_CANCELLED', 'E.USERS.SUBSCRIPTION_EXPIRED'].some(x => x === err.message))
            p.state = this.store.VALID;
          cb(false);
        });
    };
    // when a product is approved (follows store.order), start the validation through IDEA's API (verify)
    this.cbStoreOnProductApproved = (p: IAPProduct) => p.verify();
    this.store.when('paid subscription').approved(this.cbStoreOnProductApproved);
    // when a product has been verified (AppStore <-> IDEA's API), confirm the successful operation (finish)
    this.cbStoreOnProductVerified = (p: IAPProduct) => p.finish();
    this.store.when('paid subscription').verified(this.cbStoreOnProductVerified);
    // when a product has been confirmed, update the UI
    this.cbStoreOnProductFinished = () => this.changeRef.detectChanges();
    this.store.when('paid subscription').finished(this.cbStoreOnProductFinished);
    // when there is an error, show it (we can't interact with iOS/Android that much here)
    this.cbStoreOnError = () => this.message.error('IDEA.SUBSCRIPTION.ERROR_CONTACTING_STORE');
    this.store.error(this.cbStoreOnError);
    // when the store is ready, get the products info out of it
    this.cbStoreOnReady = () => {
      this.plans.forEach(plan => {
        const product = this.store.get(plan.storePlanId);
        if (product.valid) {
          plan.priceStr = product.price;
          plan.title[this.t.currentLang] = product.title;
          plan.description[this.t.currentLang] = product.description;
        }
      });
      // update the complete info to use it in the app
      this.changeRef.detectChanges();
    };
    this.store.ready(this.cbStoreOnReady);
  }
  /**
   * Reset the callbacks to avoid duplicates if the component is opened again
   */
  private dismissStore() {
    this.store.off(this.cbStoreOnReady);
    this.store.off(this.cbStoreOnError);
    this.store.off(this.cbStoreOnProductApproved);
    this.store.off(this.cbStoreOnProductVerified);
    this.store.off(this.cbStoreOnProductFinished);
  }

  /**
   * Subscribe one of the plans available (either on mobile stores or through Stripe).
   */
  public subscribe(plan: IdeaX.ProjectPlan) {
    if (plan.planId === this.subscription.planId) return;
    // request confirmation
    this.alertCtrl
      .create({
        header: this.subscription.planId
          ? this.t.instant('IDEA.SUBSCRIPTION.SUBSCRIPTION_CHANGE')
          : this.t.instant('IDEA.SUBSCRIPTION.NEW_SUBSCRIPTION'),
        message: this.t.instant('IDEA.SUBSCRIPTION.DO_YOU_CONFIRM_THE_SUBSCRIPTION_', {
          plan: plan.title[this.t.currentLang]
        }),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: () =>
              ['android', 'ios'].some(x => x === this.platformStore)
                ? this.subscribeStores(plan)
                : this.subscribeStripe(plan)
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Manage the subscription for users plans.
   */
  protected subscribeStores(plan: IdeaX.ProjectPlan) {
    const params: any = {};
    if (this.platformStore === 'android') {
      // Gooogle Play needs to know the old plan (if exists), to manage upgrades/downgrades
      const oldPlan = this.plans.find(x => x.planId === this.tc.get('user').subscription.planId);
      if (oldPlan && this.tc.get('user').subscription.validUntil > Date.now())
        params.oldPurchasedSkus = [oldPlan.storePlanId];
    }
    this.store.order(plan.storePlanId, params);
  }
  /**
   * Manage the subscription for teams plans.
   */
  protected subscribeStripe(plan: IdeaX.ProjectPlan) {
    const oldPlan = this.plans.find(x => x.planId === this.tc.get('team').subscription.planId) || {};
    this.modalCtrl
      .create({ component: IDEAStripeSubscriptionComponent, componentProps: { plan, oldPlan, target: this.target } })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data) {
            this.tc.get('team').subscription = res.data;
            this.changeRef.detectChanges();
          }
        });
        modal.present();
      });
  }

  /**
   * Reload the info from the store (/align the store with IDEA's back-end).
   */
  public restorePurchases() {
    if (['android', 'ios'].some(x => x === this.platformStore)) {
      // since the method doesn't have a callback, put a fake loader
      this.loading.show();
      setTimeout(() => this.loading.hide(), 5000);
      this.store.refresh();
    } else this.verifyStripeSubscription();
  }
  protected verifyStripeSubscription() {
    this.loading.show();
    // the request may relate to a team or to an user subscription according to the target
    const params: any = {
      resourceId:
        this.target === IdeaX.ProjectPlanTargets.TEAMS ? this.tc.get('team').teamId : this.tc.get('user').userId,
      body: { action: 'VERIFY_STORE_SUBSCRIPTION', transaction: { type: 'stripe' } }
    };
    if (this.target !== IdeaX.ProjectPlanTargets.TEAMS) params['idea'] = true;
    const url = this.target === IdeaX.ProjectPlanTargets.TEAMS ? 'teams' : 'user';
    this.API.patchResource(url, params)
      .then((subscription: IdeaX.ProjectSubscription) => {
        if (this.target === IdeaX.ProjectPlanTargets.TEAMS) this.tc.get('team').subscription = subscription;
        else this.tc.get('user').subscription = subscription;
        this.changeRef.detectChanges();
      })
      .catch(() => {
        if (this.target === IdeaX.ProjectPlanTargets.TEAMS)
          this.tc.get('team').subscription = new IdeaX.ProjectSubscription();
        else this.tc.get('user').subscription = new IdeaX.ProjectSubscription();
      })
      .finally(() => this.loading.hide());
  }

  /**
   * Open the native subscription panel of the platform, so that the user can proceed to unsubscribe.
   */
  public cancelSubscription() {
    if (!this.tc.get('team').subscription.planId) return;
    if (['android', 'ios'].some(x => x === this.platformStore)) this.store.manageSubscriptions();
    else this.cancelStripeSubscriptionAtTheEndOfPeriod(this.tc.get('team').subscription.planId);
  }
  /**
   * Set the Stripe subscription to avoid renew after the end of the period.
   */
  protected cancelStripeSubscriptionAtTheEndOfPeriod(planId: string) {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.SUBSCRIPTION.STOP_SUBSCRIPTION'),
        message: this.t.instant('IDEA.SUBSCRIPTION.SUBSCRIPTION_WONT_RENEW_ANYMORE'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: () => {
              // request a cancel at the end of the period
              // the request may relate to a team or to an user subscription
              const url =
                this.target === IdeaX.ProjectPlanTargets.TEAMS
                  ? `teams/${this.tc.get('team').teamId}/stripeSubscriptions`
                  : `stripeSubscriptions`;
              this.API.deleteResource(url, {
                idea: true,
                resourceId: planId,
                params: { project: IDEA_PROJECT }
              })
                .then(() => this.verifyStripeSubscription())
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'));
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Delete an expired subscription (so you can subscribe from other platforms).
   */
  public removeExpiredSubscription() {
    if (!this.isSubscriptionExpired(this.subscription)) return;
    this.alertCtrl
      .create({
        header: this.t.instant('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: () => {
              // request the removal
              this.loading.show();
              // the request may relate to a team or to an user subscription according to the target
              const params: any = {
                resourceId:
                  this.target === IdeaX.ProjectPlanTargets.TEAMS
                    ? this.tc.get('team').teamId
                    : this.tc.get('user').userId,
                body: { action: 'REMOVE_EXPIRED_SUBSCRIPTION' }
              };
              if (this.target !== IdeaX.ProjectPlanTargets.TEAMS) params['idea'] = true;
              const url = this.target === IdeaX.ProjectPlanTargets.TEAMS ? 'teams' : 'user';
              this.API.patchResource(url, params)
                .then((subscription: IdeaX.ProjectSubscription) => {
                  if (this.target === IdeaX.ProjectPlanTargets.TEAMS) this.tc.get('team').subscription = subscription;
                  else this.tc.get('user').subscription = subscription;
                  this.close();
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
   * Whether the subscription is expired or no.
   */
  public isSubscriptionExpired(subscription: IdeaX.ProjectSubscription): boolean {
    return subscription ? subscription.validUntil < Number(Moment().format('x')) : false;
  }

  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
