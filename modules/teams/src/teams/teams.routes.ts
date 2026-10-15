import { Routes } from '@angular/router';

import { IDEATeamsPage } from './teams.page';

export const IDEATeamsRoutes: Routes = [{ path: '', component: IDEATeamsPage }];
/**
 * @deprecated use `IDEATeamsRoutes`.
 */
export const ideaTeamsRoutes = IDEATeamsRoutes;
