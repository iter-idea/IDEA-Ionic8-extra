import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEASubscriptionComponent } from './subscription.component';
import { IDEAStripeSubscriptionModule } from './stripeSubscription.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild(), IDEAStripeSubscriptionModule],
  declarations: [IDEASubscriptionComponent],
  entryComponents: [IDEASubscriptionComponent],
  exports: [IDEASubscriptionComponent]
})
export class IDEASubscriptionModule {}
