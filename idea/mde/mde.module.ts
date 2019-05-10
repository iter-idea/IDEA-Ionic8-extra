import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAMDEComponent } from './mde.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  declarations: [
    IDEAMDEComponent
  ],
  entryComponents: [
    IDEAMDEComponent
  ],
  exports: [
    IDEAMDEComponent
  ]
})
export class IDEAMDEModule {}
