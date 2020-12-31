import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEALimitComponent } from './limit.component';
import { IDEALimitAlertComponent } from './limitAlert.component';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, IDEATranslationsModule],
  declarations: [IDEALimitComponent, IDEALimitAlertComponent],
  entryComponents: [IDEALimitComponent, IDEALimitAlertComponent],
  exports: [IDEALimitComponent, IDEALimitAlertComponent]
})
export class IDEALimitModule {}
