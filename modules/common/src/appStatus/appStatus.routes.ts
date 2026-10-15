import { Routes } from '@angular/router';

import { IDEAAppStatusPage } from './appStatus.page';

export const IDEAAppStatusRoutes: Routes = [{ path: '', component: IDEAAppStatusPage }];
/**
 * @deprecated use `IDEAAppStatusRoutes`.
 */
export const ideaAppStatusRoutes = IDEAAppStatusRoutes;
