import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEADateTimeComponent } from './dateTime.component';
import { IDEACalendarPickerComponent } from './calendarPicker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEADateTimeComponent, IDEACalendarPickerComponent],
  exports: [IDEADateTimeComponent, IDEACalendarPickerComponent]
})
export class IDEADateTimeModule {}
