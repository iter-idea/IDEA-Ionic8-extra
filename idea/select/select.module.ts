import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEASelectComponent } from './select.component';
import { IDEASuggestionsComponent } from './suggestions.component';
import { IDEABoldPrefix } from './boldPrefix.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild()
  ],
  declarations: [
    IDEASelectComponent,
    IDEASuggestionsComponent,
    IDEABoldPrefix
  ],
  entryComponents: [
    IDEASelectComponent,
    IDEASuggestionsComponent
  ],
  exports: [
    IDEASelectComponent,
    IDEASuggestionsComponent,
    IDEABoldPrefix
  ]
})
export class IDEASelectModule {}
