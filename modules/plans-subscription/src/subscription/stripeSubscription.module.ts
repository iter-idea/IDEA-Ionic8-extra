import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAStripeSubscriptionComponent } from './stripeSubscription.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAStripeSubscriptionComponent],
  entryComponents: [IDEAStripeSubscriptionComponent],
  exports: [IDEAStripeSubscriptionComponent]
})
export class IDEAStripeSubscriptionModule {}
