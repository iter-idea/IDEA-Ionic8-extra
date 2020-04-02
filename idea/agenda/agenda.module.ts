import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgCalendarModule } from 'ionic2-calendar';
// prepare the available langages for the agenda; english is included by default
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
registerLocaleData(localeIt, 'it');

import { IDEAAgendaComponent } from './agenda.component';
import { IDEACheckerModule } from '../checker/checker.module';
import { IDEAAppointmentComponent } from './appointment.component';
import { IDEADateTimeModule } from '../dateTime/dateTime.module';
import { IDEASelectModule } from '../select/select.module';
import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAAppointmentLinkedObjectComponent } from './appointmentLinkedObject.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    IDEACheckerModule,
    NgCalendarModule,
    IDEADateTimeModule,
    IDEASelectModule
  ],
  declarations: [IDEAAgendaComponent, IDEAAppointmentComponent, IDEAAppointmentLinkedObjectComponent],
  entryComponents: [IDEAAgendaComponent, IDEAAppointmentComponent, IDEAAppointmentLinkedObjectComponent],
  exports: [IDEAAgendaComponent, IDEAAppointmentComponent, IDEAAppointmentLinkedObjectComponent]
})
export class IDEAAgendaModule {}
