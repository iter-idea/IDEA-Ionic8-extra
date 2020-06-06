import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEACalendarsComponent } from './calendars.component';
import { IDEACalendarItemComponent } from './calendarItem.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEACalendarComponent } from './calendar.component';
import { IDEACheckerModule } from '../checker/checker.module';
import { IDEATranslationsModule } from '../translations/translations.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEACheckerModule],
  declarations: [
    IDEACalendarsComponent,
    IDEACalendarItemComponent,
    IDEACalendarCreationComponent,
    IDEACalendarComponent
  ],
  entryComponents: [
    IDEACalendarsComponent,
    IDEACalendarItemComponent,
    IDEACalendarCreationComponent,
    IDEACalendarComponent
  ],
  exports: [IDEACalendarsComponent, IDEACalendarItemComponent, IDEACalendarCreationComponent, IDEACalendarComponent]
})
export class IDEACalendarsModule {}
