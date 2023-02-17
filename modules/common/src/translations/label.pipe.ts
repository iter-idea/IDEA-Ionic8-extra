import { Pipe, PipeTransform } from '@angular/core';

import { IDEATranslationsService } from './translations.service';

/**
 * Handle labels with the languages loaded from IDEA's translation service.
 */
@Pipe({ name: 'label', pure: false })
export class IDEALocalizedLabelPipe implements PipeTransform {
  constructor(private t: IDEATranslationsService) {}

  transform(label: any): any {
    return this.t._label(label);
  }
}
