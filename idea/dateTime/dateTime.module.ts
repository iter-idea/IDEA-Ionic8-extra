import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEADateTimeComponent } from './dateTime.component';
import { IDEACalendarPickerComponent } from './calendarPicker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEADateTimeComponent, IDEACalendarPickerComponent],
  entryComponents: [IDEADateTimeComponent, IDEACalendarPickerComponent],
  exports: [IDEADateTimeComponent, IDEACalendarPickerComponent]
})
export class IDEADateTimeModule {}
