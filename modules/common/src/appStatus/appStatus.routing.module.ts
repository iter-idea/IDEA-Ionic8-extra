import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IDEAAppStatusPage } from './appStatus.page';

const routes: Routes = [{ path: '', component: IDEAAppStatusPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IDEAAppStatusRoutingModule {}
