import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAMembershipsPage } from './memberships.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: IDEAMembershipsPage }]),
    TranslateModule.forChild()
  ],
  declarations: [IDEAMembershipsPage]
})
export class IDEAMembershipsModule {}
