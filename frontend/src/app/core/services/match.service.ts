import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Match } from '../models/match.model';

export interface PlayerStatInput {
  player_id: number;
  golovi?: number;
  asistencije?: number;
  zuti_kartoni?: number;
  crveni_kartoni?: number;
  odbrane?: number;
  primljeni_golovi?: number;
}

export interface CompleteMatchPayload {
  rezultat_a: number;
  rezultat_b: number;
  stats?: PlayerStatInput[];
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/matches`;

  completeMatch(matchId: number, payload: CompleteMatchPayload): Observable<Match> {
    return this.http.patch<Match>(`${this.baseUrl}/${matchId}/complete`, payload);
  }
}
