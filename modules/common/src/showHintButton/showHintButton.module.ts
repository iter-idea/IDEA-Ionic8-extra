import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IDEATranslationsModule } from '../translations/translations.module';

import { IDEAShowHintButtonComponent } from './showHintButton.component';

@NgModule({
  imports: [CommonModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAShowHintButtonComponent],
  exports: [IDEAShowHintButtonComponent]
})
export class IDEAShowHintButtonModule {}
