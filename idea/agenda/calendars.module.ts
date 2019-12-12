import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { IDEACalendarsPage } from './calendars.page';
import { IDEACalendarItemComponent } from './calendarItem.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEACalendarComponent } from './calendar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: IDEACalendarsPage }]),
    TranslateModule.forChild()
  ],
  declarations: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent],
  entryComponents: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent],
  exports: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent]
})
export class IDEACalendarsModule {}
