import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEACustomFieldsComponent } from './customFields.component';
import { IDEACustomFieldManagerComponent } from './customFieldManager.component';
import { IDEAListModule } from '../list/list.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAListModule],
  entryComponents: [IDEACustomFieldsComponent, IDEACustomFieldManagerComponent],
  exports: [IDEACustomFieldsComponent, IDEACustomFieldManagerComponent],
  declarations: [IDEACustomFieldsComponent, IDEACustomFieldManagerComponent]
})
export class IDEACustomFieldsModule {}
