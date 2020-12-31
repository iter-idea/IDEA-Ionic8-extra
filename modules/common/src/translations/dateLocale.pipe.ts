import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

import { IDEATranslationsService } from './translations.service';

/**
 * Handle dates with the locale loaded from IDEA's translation service.
 */
@Pipe({
  name: 'dateLocale',
  pure: false
})
export class IDEALocalizedDatePipe implements PipeTransform {
  constructor(private t: IDEATranslationsService) {}

  /**
   * Pipe function to format the date in the correct locale.
   */
  transform(value: any, pattern: string = 'mediumDate'): any {
    const datePipe: DatePipe = new DatePipe(this.t.getCurrentLang());
    return datePipe.transform(value, pattern);
  }
}
