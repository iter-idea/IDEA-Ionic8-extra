import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { IDEATranslationsModule } from '../translations/translations.module';

import { IDEAAppStatusPage } from './appStatus.page';
import { IDEAAppStatusRoutingModule } from './appStatus.routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAAppStatusRoutingModule],
  declarations: [IDEAAppStatusPage]
})
export class IDEAAppStatusModule {}
