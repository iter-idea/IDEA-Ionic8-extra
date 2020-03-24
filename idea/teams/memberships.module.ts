import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { IDEAMembershipsPage } from './memberships.page';
import { IDEATranslationsModule } from '../translations/translations.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    RouterModule.forChild([{ path: '', component: IDEAMembershipsPage }])
  ],
  declarations: [IDEAMembershipsPage]
})
export class IDEAMembershipsModule {}
