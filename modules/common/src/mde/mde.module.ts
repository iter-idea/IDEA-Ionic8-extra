import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAMDEComponent } from './mde.component';
import { IDEAMDEToolbarComponent } from './mdeToolbar.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAMDEComponent, IDEAMDEToolbarComponent],
  exports: [IDEAMDEComponent, IDEAMDEToolbarComponent]
})
export class IDEAMDEModule {}
