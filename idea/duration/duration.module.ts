import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEADurationComponent } from './duration.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEADurationComponent],
  entryComponents: [IDEADurationComponent],
  exports: [IDEADurationComponent]
})
export class IDEADurationModule {}
