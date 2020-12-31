import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';

@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
  // MONTH VIEW
  public monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'EEE', locale);
  }
  public monthViewTitle({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'MMMM y', locale);
  }
  // WEEK VIEW
  public weekViewHour({ date, locale }: DateFormatterParams): string {
    return locale === 'it' ? formatDate(date, 'HH:mm', locale) : formatDate(date, 'h aa', locale);
  }
  public weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'EEE', locale);
  }
  public weekViewTitle({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'MMMM yyyy', locale);
  }
  // DAY VIEW
  public dayViewHour({ date, locale }: DateFormatterParams): string {
    return locale === 'it' ? formatDate(date, 'HH:mm', locale) : formatDate(date, 'h aa', locale);
  }
  public dayViewTitle({ date, locale }: DateFormatterParams): string {
    return locale === 'it'
      ? formatDate(date, 'EEEE, dd MMM yyyy', locale)
      : formatDate(date, 'EEEE, MMM dd, yyyy', locale);
  }
}
