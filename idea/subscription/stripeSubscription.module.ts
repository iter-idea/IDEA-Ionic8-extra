import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAStripeSubscriptionComponent } from './stripeSubscription.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEAStripeSubscriptionComponent],
  entryComponents: [IDEAStripeSubscriptionComponent],
  exports: [IDEAStripeSubscriptionComponent]
})
export class IDEAStripeSubscriptionModule {}
