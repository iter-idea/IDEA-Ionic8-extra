import { Component, Input } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;
import { get } from 'scriptjs';
import { Label, Membership, ProjectPlan, ProjectPlanTargets, ProjectSubscription, Team, User } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService
} from '@idea-ionic/common';

import { environment as env } from '@env';

// loaded via script
declare const Stripe: any;

@Component({
  selector: 'stripe-subscription',
  templateUrl: 'stripeSubscription.component.html',
  styleUrls: ['stripeSubscription.component.scss']
})
export class IDEAStripeSubscriptionComponent {
  /**
   * The target of the subscription, to decide which plans to load.
   */
  @Input() public target: ProjectPlanTargets;
  /**
   * The plan we want to activate.
   */
  @Input() public plan: ProjectPlan;
  /**
   * The currently active plan, if any.
   */
  @Input() public oldPlan: ProjectPlan;
  /**
   * The Stripe object to manage the payments.
   */
  protected stripe: any;
  /**
   * The object to securely manage the credit card information of the user (through Stripe).
   */
  public creditCard: any;
  /**
   * Whether the user accepted the authorization check (obligatory).
   */
  public authorizationCheck: boolean;
  /**
   * The id of the existing/future subscription, based on the target.
   */
  public subscriptionId: string;
  /**
   * The current membership.
   */
  public membership: Membership;
  /**
   * The current user.
   */
  public user: User;
  /**
   * The current team.
   */
  public team: Team;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ionViewDidEnter() {
    this.authorizationCheck = false;
    this.membership = this.tc.get('membership');
    this.user = this.tc.get('user');
    this.team = this.tc.get('team');
    // if a plan to subscribe to wasn't specified, close the component
    if (!this.plan) return this.close();
    // define target and subscription id
    this.target = this.target || ProjectPlanTargets.TEAMS;
    if (this.target === ProjectPlanTargets.TEAMS) this.subscriptionId = this.membership.teamId;
    else this.subscriptionId = this.membership.userId;
    // load Stripe's libs
    this.loadStripeLibs().then(() => {
      // init Stripe elements in the UI,
      this.creditCard = this.stripe.elements().create('card');
      this.creditCard.mount('#cardElement');
      // (aync) refresh the validation to align last Stripe changes with IDEA's back-end
      this.validateSubscription(true);
    });
  }

  /**
   * Load Stripe's libs. Resolve the chosen promise when the SDK is fully loaded.
   */
  private loadStripeLibs(): Promise<void> {
    return new Promise(resolve => {
      // be sure the scripts have been injected
      this.injectStripeScripts().then(() => {
        // init Stripe lib
        this.stripe = Stripe(env.stripe.publicKey);
        resolve();
      });
    });
  }
  /**
   * Inject the Stripe's scripts, avoiding repeating the import more than one time.
   */
  private injectStripeScripts(): Promise<void> {
    return new Promise(resolve => {
      if (this.tc.get('stripeLibLoaded')) return resolve();
      get('https://js.stripe.com/v3/', () => {
        this.tc.set('stripeLibLoaded', true);
        resolve();
      });
    });
  }

  /**
   * Open Stripe's website with information on how payments are secure.
   */
  public openStripeInfo() {
    const url = 'https://stripe.com/docs/security/stripe';
    Browser.open({ url });
  }
  /**
   * Open IDEA's website.
   */
  public openWebsite(ev: any) {
    if (ev) ev.stopPropagation();
    Browser.open({ url: env.idea.website });
  }

  /**
   * Subscribe to a plan through Stripe.
   */
  public subscribe() {
    // acquire the credid card info and create a token to be sent to Stripe through our back-end
    this.stripe.createToken(this.creditCard).then(async (resT: any) => {
      if (resT.error) return this.message.error('IDEA_PS.STRIPE.INVALID_CREDIT_CARD');
      // send the token to the back-end and request the subscription (transparent upgrade/downgrade)
      await this.loading.show();
      // get the detailed information about the plan: storePlanId is needed
      this.API.getResource(`projects/${String(env.idea.project)}/plans`, { idea: true, resourceId: this.plan.planId })
        .then((plan: ProjectPlan) => {
          this.API.postResource(`projects/${String(env.idea.project)}/stripeCustomers/${this.subscriptionId}/plans`, {
            idea: true,
            resourceId: plan.storePlanId,
            body: {
              name: this.target === ProjectPlanTargets.TEAMS ? this.team.name : this.user.email,
              email: this.user.email,
              source: resT.token.id
            }
          })
            .then((res: any) => {
              const latestInvoice = res.latest_invoice;
              // distinguish downgrade/upgrade scenario from new subscriptions
              if (!latestInvoice.payment_intent) this.validateSubscription();
              else
                switch (latestInvoice.payment_intent.status) {
                  // handle the result based on the returned status of the last payment
                  case 'succeeded':
                    this.validateSubscription();
                    break;
                  case 'requires_payment_method':
                    this.message.error('IDEA_PS.STRIPE.ERROR_DURING_PAYMENT_CHECK_CARD');
                    break;
                  case 'requires_action':
                    this.stripe
                      .handleCardPayment(res.latest_invoice.payment_intent.client_secret)
                      .then((challengeRes: any) => {
                        if (challengeRes.error) return this.message.error('COMMON.OPERATION_FAILED');
                        else this.validateSubscription();
                      });
                    break;
                  default:
                    this.message.error('COMMON.OPERATION_FAILED');
                }
            })
            .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
            .finally(() => this.loading.hide());
        })
        .catch(() => {
          this.loading.hide();
          this.message.error('IDEA_PS.SUBSCRIPTION.PLAN_NOT_FOUND');
        });
    });
  }
  /**
   * Validate a subscription against IDEA's back-end.
   */
  protected async validateSubscription(silent?: boolean) {
    if (!silent) await this.loading.show();
    this.API.patchResource(`projects/${String(env.idea.project)}/subscriptions`, {
      idea: true,
      resourceId: this.subscriptionId,
      body: { action: 'VERIFY', transaction: { type: 'stripe' } }
    })
      .then((subscription: ProjectSubscription) => {
        if (!silent) {
          this.message.success('IDEA_PS.STRIPE.SUCCESSFULLY_SUBSCRIBED');
          this.close(subscription);
        }
      })
      .catch(() => {
        if (!silent) this.message.error('COMMON.OPERATION_FAILED');
      })
      .finally(() => {
        if (!silent) this.loading.hide();
      });
  }

  /**
   * Get a label's value.
   */
  public getLabelValue(label: Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Close the modal.
   */
  public close(subscription?: ProjectSubscription) {
    this.modalCtrl.dismiss(subscription);
  }
}
