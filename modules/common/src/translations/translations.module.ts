import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslatePipe } from './translations.pipe';
import { IDEALanguagePickerComponent } from './languagePicker.component';
import { IDEALocalizedDatePipe } from './dateLocale.pipe';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule],
    declarations: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALanguagePickerComponent],
    exports: [IDEATranslatePipe, IDEALocalizedDatePipe, IDEALanguagePickerComponent]
})
export class IDEATranslationsModule {}
