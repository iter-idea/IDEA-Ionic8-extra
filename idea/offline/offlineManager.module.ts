import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineBarComponent } from './offlineBar.component';

@NgModule({
  imports: [CommonModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEAOfflineManagerComponent, IDEAOfflineBarComponent],
  entryComponents: [IDEAOfflineManagerComponent, IDEAOfflineBarComponent],
  exports: [IDEAOfflineManagerComponent, IDEAOfflineBarComponent]
})
export class IDEAOfflineManagerModule {}
