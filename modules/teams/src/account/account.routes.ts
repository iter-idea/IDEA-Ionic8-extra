import { Routes } from '@angular/router';

import { IDEAAccountPage } from './account.page';

export const IDEAAccountRoutes: Routes = [{ path: '', component: IDEAAccountPage }];
/**
 * @deprecated use `IDEAAccountRoutes`.
 */
export const ideaAccountRoutes = IDEAAccountRoutes;
