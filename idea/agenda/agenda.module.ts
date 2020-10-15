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

import { IDEAAgendaComponent } from './agenda.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory })
  ],
  declarations: [IDEAAgendaComponent],
  entryComponents: [IDEAAgendaComponent],
  exports: [IDEAAgendaComponent],
  providers: [{ provide: CalendarDateFormatter, useClass: CustomDateFormatter }]
})
export class IDEAAgendaModule {}
