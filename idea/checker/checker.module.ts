import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEACheckerComponent } from './checker.component';
import { IDEAChecksComponent } from './checks.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEACheckerComponent, IDEAChecksComponent],
  entryComponents: [IDEACheckerComponent, IDEAChecksComponent],
  exports: [IDEACheckerComponent, IDEAChecksComponent]
})
export class IDEACheckerModule {}
