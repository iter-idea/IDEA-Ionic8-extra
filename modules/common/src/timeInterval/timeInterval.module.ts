import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';

import { IDEATimeIntervalComponent } from './timeInterval.component';
import { IDEAFromTimeToTimeComponent } from './fromTimeToTime.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAFromTimeToTimeComponent, IDEATimeIntervalComponent],
  exports: [IDEAFromTimeToTimeComponent, IDEATimeIntervalComponent]
})
export class IDEATimeIntervalModule {}
