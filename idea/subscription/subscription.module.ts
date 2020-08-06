import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASubscriptionComponent } from './subscription.component';
import { IDEAStripeSubscriptionModule } from './stripeSubscription.module';
import { IDEASubscriptionSummaryComponent } from './subscriptionSummary.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAStripeSubscriptionModule],
  declarations: [IDEASubscriptionComponent, IDEASubscriptionSummaryComponent],
  entryComponents: [IDEASubscriptionComponent, IDEASubscriptionSummaryComponent],
  exports: [IDEASubscriptionComponent, IDEASubscriptionSummaryComponent]
})
export class IDEASubscriptionModule {}
