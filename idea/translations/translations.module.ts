import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslatePipe } from './translations.pipe';
import { IDEALanguagePickerComponent } from './languagePicker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEATranslatePipe, IDEALanguagePickerComponent],
  entryComponents: [IDEALanguagePickerComponent],
  exports: [IDEATranslatePipe, IDEALanguagePickerComponent]
})
export class IDEATranslationsModule {}
