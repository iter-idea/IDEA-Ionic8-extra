import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEACustomFieldsComponent } from './customFields.component';
import { IDEACustomFieldManagerComponent } from './customFieldManager.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  entryComponents: [
    IDEACustomFieldsComponent,
    IDEACustomFieldManagerComponent
  ],
  exports: [
    IDEACustomFieldsComponent,
    IDEACustomFieldManagerComponent
  ],
  declarations: [
    IDEACustomFieldsComponent, IDEACustomFieldManagerComponent
  ]
})
export class IDEACustomFieldsModule {}
