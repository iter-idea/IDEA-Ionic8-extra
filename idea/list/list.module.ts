import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAListComponent } from './list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  declarations: [
    IDEAListComponent
  ],
  entryComponents: [
    IDEAListComponent
  ],
  exports: [
    IDEAListComponent
  ]
})
export class IDEAListModule {}
