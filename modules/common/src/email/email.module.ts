import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';
import { IDEAListModule } from '../list/list.module';

import { IDEAEmailDataComponent } from './emailData.component';
import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    IDEAListModule,
    IDEAHiglightedVariablesPipe
  ],
  declarations: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent],
  exports: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent]
})
export class IDEAEmailModule {}
