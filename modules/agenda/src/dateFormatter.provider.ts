import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';

@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
  // MONTH VIEW
  monthViewColumnHeader = ({ date, locale }: DateFormatterParams): string => formatDate(date, 'EEE', locale);
  monthViewTitle = ({ date, locale }: DateFormatterParams): string => formatDate(date, 'MMMM y', locale);

  // WEEK VIEW
  weekViewHour = ({ date, locale }: DateFormatterParams): string =>
    locale === 'it' ? formatDate(date, 'HH:mm', locale) : formatDate(date, 'h aa', locale);
  weekViewColumnHeader = ({ date, locale }: DateFormatterParams): string => formatDate(date, 'EEE', locale);
  weekViewTitle = ({ date, locale }: DateFormatterParams): string => formatDate(date, 'MMMM yyyy', locale);

  // DAY VIEW
  dayViewHour = ({ date, locale }: DateFormatterParams): string =>
    locale === 'it' ? formatDate(date, 'HH:mm', locale) : formatDate(date, 'h aa', locale);
  dayViewTitle = ({ date, locale }: DateFormatterParams): string =>
    locale === 'it' ? formatDate(date, 'EEEE, dd MMM yyyy', locale) : formatDate(date, 'EEEE, MMM dd, yyyy', locale);
}
