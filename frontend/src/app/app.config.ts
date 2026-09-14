import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tournamentFeatureKey, tournamentReducer } from './store/tournaments/tournament.reducer';
import { TournamentEffects } from './store/tournaments/tournament.effects';
import { teamFeatureKey, teamReducer } from './store/teams/team.reducer';
import { TeamEffects } from './store/teams/team.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [tournamentFeatureKey]: tournamentReducer,
      [teamFeatureKey]: teamReducer,
    }),
    provideEffects([TournamentEffects, TeamEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
