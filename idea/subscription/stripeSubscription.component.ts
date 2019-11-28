import { Component, Input } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEAExtBrowserService } from '../extBrowser.service';

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
  protected stripe: any;

  @Input() public plan: IdeaX.ProjectPlan;
  @Input() public oldPlan: IdeaX.ProjectPlan;
  @Input() public target: string;
  public creditCard: any;
  public authorizationCheck: boolean;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public extBrowser: IDEAExtBrowserService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {
    this.authorizationCheck = false;
  }
  public ionViewDidEnter() {
    // if a plan to subscribe to wasn't specified, close the component
    if (!this.plan || !this.plan.planId) this.close();
    // init Stripe lib and its elements in the UI
    this.stripe = Stripe(STRIPE_PUBLIC_KEY);
    this.creditCard = this.stripe.elements().create('card');
    this.creditCard.mount('#cardElement');
    // refresh the validation to align last Stripe changes with IDEA's back-end
    // Note: the request may relate to a team or to an user subscription according to the target
    const params: any = {
      resourceId:
        this.target === IdeaX.ProjectPlanTargets.TEAMS ? this.tc.get('team').teamId : this.tc.get('user').userId,
      body: { action: 'VERIFY_STORE_SUBSCRIPTION', transaction: { type: 'stripe' } }
    };
    if (this.target !== IdeaX.ProjectPlanTargets.TEAMS) params['idea'] = true;
    const url = this.target === IdeaX.ProjectPlanTargets.TEAMS ? 'teams' : 'user';
    this.API.patchResource(url, params).catch(() => {});
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
      // the request may relate to a team or to an user subscription
      const url =
        this.target === IdeaX.ProjectPlanTargets.TEAMS
          ? `teams/${this.tc.get('team').teamId}/stripeSubscriptions`
          : `stripeSubscriptions`;
      this.API.postResource(url, {
        idea: true,
        resourceId: this.plan.planId,
        body: { source: resT.token.id, project: IDEA_PROJECT }
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
    });
  }
  /**
   * Validate a subscription against IDEA's back-end.
   */
  protected validateSubscription() {
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
        this.message.success('IDEA.STRIPE.SUCCESSFULLY_SUBSCRIBED');
        this.close(subscription);
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  /**
   * Close the modal.
   */
  public close(subscription?: IdeaX.ProjectSubscription) {
    this.modalCtrl.dismiss(subscription);
  }
}
