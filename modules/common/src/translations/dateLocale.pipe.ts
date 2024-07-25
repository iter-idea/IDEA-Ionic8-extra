import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { IDEATranslationsService } from './translations.service';

/**
 * Handle dates with the locale loaded from IDEA's translation service.
 */
@Pipe({ name: 'dateLocale', pure: false })
export class IDEALocalizedDatePipe implements PipeTransform {
  private _translate = inject(IDEATranslationsService);

  /**
   * Pipe function to format the date in the correct locale.
   */
  transform(value: any, pattern: string = 'mediumDate'): any {
    const datePipe: DatePipe = new DatePipe(this._translate.getCurrentLang());
    return datePipe.transform(value, pattern);
  }
}
