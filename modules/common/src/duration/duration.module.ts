import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEADurationComponent } from './duration.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEADurationComponent],
  entryComponents: [IDEADurationComponent],
  exports: [IDEADurationComponent]
})
export class IDEADurationModule {}
