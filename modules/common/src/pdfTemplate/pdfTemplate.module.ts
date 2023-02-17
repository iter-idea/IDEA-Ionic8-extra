import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAVariablesModule } from '../variables/variables.module';

import { IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent } from './pdfTemplate.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAVariablesModule],
  declarations: [IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent],
  exports: [IDEAPDFTemplateComponent, IDEAPDFTemplateFieldResizeComponent]
})
export class IDEAPDFTemplateModule {}
