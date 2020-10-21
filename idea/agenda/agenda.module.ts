import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CalendarDateFormatter, CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
// prepare the available langages for the agenda; english is included by default
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { CustomDateFormatter } from './dateFormatter.provider';
registerLocaleData(localeIt, 'it');

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAColorPickerModule } from '../colors/colorPicker.module';

import { IDEAAgendaComponent } from './agenda.component';
import { IDEACalendarComponent } from './calendar.component';
import { IDEACalendarItemComponent } from './calendarItem.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEACheckerModule } from '../checker/checker.module';
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
