import { NgModule } from '@angular/core';

import { IDEATranslatePipe } from './translate.pipe';
import { IDEALocalizedDatePipe } from './dateLocale.pipe';
import { IDEALocalizedLabelPipe } from './label.pipe';

import { IDEALanguagePickerComponent } from './languagePicker.component';

/**
 * @deprecated use standalone imports instead
 * @todo to remove in future releases
 */
@NgModule({
  imports: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALocalizedLabelPipe, IDEALanguagePickerComponent],
  exports: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALocalizedLabelPipe, IDEALanguagePickerComponent]
})
export class IDEATranslationsModule {}
