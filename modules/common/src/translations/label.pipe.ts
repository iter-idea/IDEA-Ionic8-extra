import { Pipe, PipeTransform, inject } from '@angular/core';

import { IDEATranslationsService } from './translations.service';

/**
 * Handle labels with the languages loaded from IDEA's translation service.
 */
@Pipe({ name: 'label', pure: false, standalone: true })
export class IDEALocalizedLabelPipe implements PipeTransform {
  private _translate = inject(IDEATranslationsService);

  transform(label: any): any {
    if (!label) return null;
    return this._translate._label(label);
  }
}
