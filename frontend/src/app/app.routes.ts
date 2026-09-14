import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'tournaments',
    loadComponent: () =>
      import('./features/tournaments/tournament-list/tournament-list').then(
        (m) => m.TournamentList,
      ),
  },
  {
    path: 'tournaments/:id',
    loadComponent: () =>
      import('./features/tournaments/tournament-detail/tournament-detail').then(
        (m) => m.TournamentDetail,
      ),
  },
  {
    path: 'teams',
    loadComponent: () => import('./features/teams/team-list/team-list').then((m) => m.TeamList),
  },
  {
    path: 'teams/:id',
    loadComponent: () =>
      import('./features/teams/team-detail/team-detail').then((m) => m.TeamDetail),
  },
  {
    path: 'players/:id',
    loadComponent: () =>
      import('./features/players/player-detail/player-detail').then((m) => m.PlayerDetail),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'my-team',
    canActivate: [roleGuard(Role.KAPITEN)],
    loadComponent: () => import('./features/my-team/my-team').then((m) => m.MyTeam),
  },
  {
    path: 'admin',
    canActivate: [roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: '' },
];
