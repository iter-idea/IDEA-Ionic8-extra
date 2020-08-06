import { Component, Input } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEAExtBrowserService } from '../extBrowser.service';
import { IDEATranslationsService } from '../translations/translations.service';

// from index.html
declare const Stripe: any;
// from idea-config.js
declare const STRIPE_PUBLIC_KEY: string;
declare const IDEA_AUTH_WEBSITE: string;
declare const IDEA_PROJECT: string;

@Component({
  selector: 'stripe-subscription',
  templateUrl: 'stripeSubscription.component.html',
  styleUrls: ['stripeSubscription.component.scss']
})
export class IDEAStripeSubscriptionComponent {
  /**
   * The target of the subscription, to decide which plans to load.
   */
  @Input() public target: IdeaX.ProjectPlanTargets;
  /**
   * The plan we want to activate.
   */
  @Input() public plan: IdeaX.ProjectPlan;
  /**
   * The currently active plan, if any.
   */
  @Input() public oldPlan: IdeaX.ProjectPlan;
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
  public membership: IdeaX.Membership;
  /**
   * The current user.
   */
  public user: IdeaX.User;
  /**
   * The current team.
   */
  public team: IdeaX.Team;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public extBrowser: IDEAExtBrowserService,
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
    this.target = this.target || IdeaX.ProjectPlanTargets.TEAMS;
    if (this.target === IdeaX.ProjectPlanTargets.TEAMS) this.subscriptionId = this.membership.teamId;
    else this.subscriptionId = this.membership.userId;
    // init Stripe lib and its elements in the UI
    this.stripe = Stripe(STRIPE_PUBLIC_KEY);
    this.creditCard = this.stripe.elements().create('card');
    this.creditCard.mount('#cardElement');
    // (aync) refresh the validation to align last Stripe changes with IDEA's back-end
    this.validateSubscription(true);
  }

  /**
   * Open Stripe's website with information on how payments are secure.
   */
  public openStripeInfo() {
    this.extBrowser.openLink('https://stripe.com/docs/security/stripe');
  }
  /**
   * Open IDEA's website.
   */
  public openWebsite(ev: any) {
    if (ev) ev.stopPropagation();
    this.extBrowser.openLink(IDEA_AUTH_WEBSITE);
  }

  /**
   * Subscribe to a plan through Stripe.
   */
  public subscribe() {
    // acquire the credid card info and create a token to be sent to Stripe through our back-end
    this.stripe.createToken(this.creditCard).then((resT: any) => {
      if (resT.error) return this.message.error('IDEA.STRIPE.INVALID_CREDIT_CARD');
      // send the token to the back-end and request the subscription (transparent upgrade/downgrade)
      this.loading.show();
      // get the detailed information about the plan: storePlanId is needed
      this.API.getResource(`projects/${IDEA_PROJECT}/plans`, { idea: true, resourceId: this.plan.planId })
        .then((plan: IdeaX.ProjectPlan) => {
          this.API.postResource('stripeSubscriptions', {
            idea: true,
            resourceId: plan.storePlanId,
            body: {
              subscriberId: this.subscriptionId,
              name: this.target === IdeaX.ProjectPlanTargets.TEAMS ? this.team.name : this.user.email,
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
                    this.message.error('IDEA.STRIPE.ERROR_DURING_PAYMENT_CHECK_CARD');
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
          this.message.error('IDEA.SUBSCRIPTION.PLAN_NOT_FOUND');
        });
    });
  }
  /**
   * Validate a subscription against IDEA's back-end.
   */
  protected validateSubscription(silent?: boolean) {
    if (!silent) this.loading.show();
    this.API.patchResource(`projects/${IDEA_PROJECT}/subscriptions`, {
      idea: true,
      resourceId: this.subscriptionId,
      body: { action: 'VERIFY', transaction: { type: 'stripe' } }
    })
      .then((subscription: IdeaX.ProjectSubscription) => {
        if (!silent) {
          this.message.success('IDEA.STRIPE.SUCCESSFULLY_SUBSCRIBED');
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
  public getLabelValue(label: IdeaX.Label): string {
    if (!label) return null;
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Close the modal.
   */
  public close(subscription?: IdeaX.ProjectSubscription) {
    this.modalCtrl.dismiss(subscription);
  }
}
