import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAEmailDataComponent } from './emailData.component';
import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';
import { IDEAMDEModule } from '../mde/mde.module';
import { IDEAHiglightedVariables } from './highlightedVariables.pipe';
import { IDEAListModule } from '../list/list.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAMDEModule, IDEAListModule],
  declarations: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent, IDEAHiglightedVariables],
  entryComponents: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent],
  exports: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent, IDEAHiglightedVariables]
})
export class IDEAEmailModule {}
