import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEASignatureComponent } from './signature.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  declarations: [
    IDEASignatureComponent
  ],
  entryComponents: [
    IDEASignatureComponent
  ],
  exports: [
    IDEASignatureComponent
  ]
})
export class IDEASignatureModule {}
