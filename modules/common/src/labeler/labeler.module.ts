import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';

import { IDEALabelerComponent } from './labeler.component';
import { IDEALabelComponent } from './label.component';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, IDEATranslationsModule, IDEAHiglightedVariablesPipe],
  declarations: [IDEALabelerComponent, IDEALabelComponent],
  exports: [IDEALabelerComponent, IDEALabelComponent]
})
export class IDEALabelerModule {}
