import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAMDEComponent } from './mde.component';
import { IDEAMDEToolbarComponent } from './mdeToolbar.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEAMDEComponent, IDEAMDEToolbarComponent],
  entryComponents: [IDEAMDEComponent, IDEAMDEToolbarComponent],
  exports: [IDEAMDEComponent, IDEAMDEToolbarComponent]
})
export class IDEAMDEModule {}
