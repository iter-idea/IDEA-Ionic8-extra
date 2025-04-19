import { Pipe, PipeTransform, inject } from '@angular/core';

import { IDEATranslationsService } from './translations.service';

/**
 * Handle dates with the locale loaded from IDEA's translation service.
 */
@Pipe({ name: 'dateLocale', pure: false, standalone: true })
export class IDEALocalizedDatePipe implements PipeTransform {
  private _translate = inject(IDEATranslationsService);

  /**
   * Pipe function to format the date in the correct locale (optionally forcing a timeZone).
   */
  transform(value: any, pattern: string = 'mediumDate', timeZone?: string): any {
    return this._translate.formatDate(value, pattern, timeZone);
  }
}
