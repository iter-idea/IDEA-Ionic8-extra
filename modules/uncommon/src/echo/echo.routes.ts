import { Routes } from '@angular/router';

import { IDEAEchoPage } from './echo.page';

export const IDEAEchoRoutes: Routes = [
  { path: '', component: IDEAEchoPage },
  { path: ':request', component: IDEAEchoPage }
];
/**
 * @deprecated use `IDEAEchoRoutes`.
 */
export const ideaEchoRoutes = IDEAEchoRoutes;
