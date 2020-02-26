import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineIndicatorComponent } from './offlineIndicator.component';

@NgModule({
  imports: [CommonModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent],
  entryComponents: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent],
  exports: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent]
})
export class IDEAOfflineModule {}
