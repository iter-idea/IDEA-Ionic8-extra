import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAEchoPage } from './echo.page';

const routes = [
  { path: '', component: IDEAEchoPage },
  { path: ':request', component: IDEAEchoPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, RouterModule.forChild(routes)],
  declarations: [IDEAEchoPage]
})
export class IDEAEchoModule {}
