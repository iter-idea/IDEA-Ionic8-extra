import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IDEALabelerComponent } from './labeler.component';
import { IDEAMDEModule } from '../mde/mde.module';
import { IDEATranslationsModule } from '../translations/translations.module';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, IDEATranslationsModule, IDEAMDEModule],
  declarations: [IDEALabelerComponent],
  entryComponents: [IDEALabelerComponent],
  exports: [IDEALabelerComponent]
})
export class IDEALabelerModule {}
