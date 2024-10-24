import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';

import { IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent } from './pdfTemplate.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAHiglightedVariablesPipe],
  declarations: [IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent],
  exports: [IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent]
})
export class IDEAPDFTemplateModule {}
