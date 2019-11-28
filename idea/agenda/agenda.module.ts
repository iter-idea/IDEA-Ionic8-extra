import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgCalendarModule } from 'ionic2-calendar';
// prepare the available langages for the agenda (calendar); english is included by default
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
registerLocaleData(localeIt, 'it');

import { IDEAAgendaComponent } from './agenda.component';
import { IDEACheckerModule } from '../checker/checker.module';
import { IDEAAppointmentComponent } from './appointment.component';
import { IDEACalendarModule } from '../calendar/calendar.module';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    IDEACheckerModule,
    NgCalendarModule,
    IDEACalendarModule,
    IDEASelectModule
  ],
  declarations: [IDEAAgendaComponent, IDEAAppointmentComponent],
  entryComponents: [IDEAAgendaComponent, IDEAAppointmentComponent],
  exports: [IDEAAgendaComponent, IDEAAppointmentComponent]
})
export class IDEAAgendaModule {}
