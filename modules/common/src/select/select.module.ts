import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEABoldPrefix } from './boldPrefix.pipe';
import { IDEASelectComponent } from './select.component';
import { IDEASuggestionsComponent } from './suggestions.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEASelectComponent, IDEASuggestionsComponent, IDEABoldPrefix],
  entryComponents: [IDEASelectComponent, IDEASuggestionsComponent],
  exports: [IDEASelectComponent, IDEASuggestionsComponent, IDEABoldPrefix]
})
export class IDEASelectModule {}
