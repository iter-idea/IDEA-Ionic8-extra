import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEACalendarComponent } from './calendar.component';
import { IDEADateTimeComponent } from './dateTime.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEACalendarComponent, IDEADateTimeComponent],
  entryComponents: [IDEACalendarComponent, IDEADateTimeComponent],
  exports: [IDEACalendarComponent, IDEADateTimeComponent]
})
export class IDEACalendarModule {}
