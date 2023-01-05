import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IDEATranslationsModule } from '../translations/translations.module';

import { ShowHintButtonComponent } from './showHintButton.component';

@NgModule({
  imports: [CommonModule, IonicModule, IDEATranslationsModule],
  declarations: [ShowHintButtonComponent],
  exports: [ShowHintButtonComponent]
})
export class ShowHintButtonModule {}
