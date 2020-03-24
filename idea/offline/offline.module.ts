import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineIndicatorComponent } from './offlineIndicator.component';

@NgModule({
  imports: [CommonModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent],
  entryComponents: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent],
  exports: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent]
})
export class IDEAOfflineModule {}
