import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CalendarDateFormatter, CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CustomDateFormatter } from './dateFormatter.provider';

import { IDEATranslationsModule, IDEAColorPickerModule, IDEACheckerModule } from '@idea-ionic/common';

import { IDEAAgendaComponent } from './agenda.component';
import { IDEACalendarComponent } from './calendar.component';
import { IDEACalendarItemComponent } from './calendarItem.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';

import { IDEACalendarsService } from './calendars.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    IDEAColorPickerModule,
    IDEACheckerModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory })
  ],
  declarations: [IDEAAgendaComponent, IDEACalendarComponent, IDEACalendarItemComponent, IDEACalendarCreationComponent],
  entryComponents: [
    IDEAAgendaComponent,
    IDEACalendarComponent,
    IDEACalendarItemComponent,
    IDEACalendarCreationComponent
  ],
  exports: [IDEAAgendaComponent, IDEACalendarComponent, IDEACalendarItemComponent, IDEACalendarCreationComponent],
  providers: [{ provide: CalendarDateFormatter, useClass: CustomDateFormatter }, IDEACalendarsService]
})
export class IDEAAgendaModule {}
