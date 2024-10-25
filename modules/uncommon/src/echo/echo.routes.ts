import { Routes } from '@angular/router';

import { IDEAEchoPage } from './echo.page';

export const ideaEchoRoutes: Routes = [
  { path: '', component: IDEAEchoPage },
  { path: ':request', component: IDEAEchoPage }
];
