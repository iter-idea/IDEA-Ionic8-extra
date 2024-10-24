import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAEmailDataComponent } from './emailData.component';
import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';
import { IDEAListModule } from '../list/list.module';
import { IDEAVariablesModule } from '../variables/variables.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAListModule, IDEAVariablesModule],
  declarations: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent],
  exports: [IDEAEmailDataComponent, IDEAEmailDataConfigurationComponent]
})
export class IDEAEmailModule {}
