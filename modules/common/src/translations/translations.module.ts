import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslatePipe } from './translations.pipe';
import { IDEALocalizedDatePipe } from './dateLocale.pipe';
import { IDEALocalizedLabelPipe } from './label.pipe';

import { IDEALanguagePickerComponent } from './languagePicker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALocalizedLabelPipe, IDEALanguagePickerComponent],
  exports: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALocalizedLabelPipe, IDEALanguagePickerComponent]
})
export class IDEATranslationsModule {}
