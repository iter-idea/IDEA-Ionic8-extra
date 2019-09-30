import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAEchoPage } from './echo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: IDEAEchoPage }]),
    TranslateModule.forChild()
  ],
  declarations: [IDEAEchoPage]
})
export class IDEAEchoModule {}
