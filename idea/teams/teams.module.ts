import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEATeamsPage } from './teams.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    RouterModule.forChild([{ path: '', component: IDEATeamsPage }])
  ],
  declarations: [IDEATeamsPage]
})
export class IDEATeamsModule {}
