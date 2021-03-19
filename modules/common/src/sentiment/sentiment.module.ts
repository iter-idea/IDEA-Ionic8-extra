import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';

import { IDEASentimentComponent } from './sentiment.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEASentimentComponent],
  entryComponents: [IDEASentimentComponent],
  exports: [IDEASentimentComponent]
})
export class IDEASentimentModule {}
