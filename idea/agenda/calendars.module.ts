import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { IDEACalendarsPage } from './calendars.page';
import { IDEACalendarItemComponent } from './calendarItem.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEACalendarComponent } from './calendar.component';
import { IDEACheckerModule } from '../checker/checker.module';
import { IDEATranslationsModule } from '../translations/translations.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: IDEACalendarsPage }]),
    IDEATranslationsModule,
    IDEACheckerModule
  ],
  declarations: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent],
  entryComponents: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent],
  exports: [IDEACalendarsPage, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent]
})
export class IDEACalendarsModule {}
