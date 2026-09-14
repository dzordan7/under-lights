import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Tournament,
  TournamentStatus,
  Group,
  TopScorer,
  TopGoalkeeper,
} from '../models/tournament.model';
import { TeamTournament } from '../models/team.model';
import { Match } from '../models/match.model';
import { Award, AwardType, AwardSuggestion } from '../models/award.model';

export interface CreateTournamentPayload {
  naziv: string;
  grad: string;
  lokacija?: string;
  broj_grupa: number;
  datum_pocetka?: string;
}

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tournaments`;

  getAll(grad?: string, status?: TournamentStatus | ''): Observable<Tournament[]> {
    const params: Record<string, string> = {};
    if (grad) params['grad'] = grad;
    if (status) params['status'] = status;
    return this.http.get<Tournament[]>(this.baseUrl, { params });
  }

  getOne(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateTournamentPayload): Observable<Tournament> {
    return this.http.post<Tournament>(this.baseUrl, payload);
  }

  register(tournamentId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${tournamentId}/register`, {});
  }

  getGroups(id: number): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}/${id}/groups`);
  }

  getStandings(id: number): Observable<TeamTournament[]> {
    return this.http.get<TeamTournament[]>(`${this.baseUrl}/${id}/standings`);
  }

  getMatches(id: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.baseUrl}/${id}/matches`);
  }

  getTopScorers(id: number): Observable<TopScorer[]> {
    return this.http.get<TopScorer[]>(`${this.baseUrl}/${id}/top-scorers`);
  }

  getTopGoalkeepers(id: number): Observable<TopGoalkeeper[]> {
    return this.http.get<TopGoalkeeper[]>(`${this.baseUrl}/${id}/top-goalkeepers`);
  }

  getAwards(id: number): Observable<Award[]> {
    return this.http.get<Award[]>(`${this.baseUrl}/${id}/awards`);
  }

  getRegistrations(id: number): Observable<TeamTournament[]> {
    return this.http.get<TeamTournament[]>(`${this.baseUrl}/${id}/registrations`);
  }

  updateRegistrationStatus(
    registrationId: number,
    status: 'ODOBRENO' | 'ODBIJENO',
  ): Observable<TeamTournament> {
    return this.http.patch<TeamTournament>(`${this.baseUrl}/registrations/${registrationId}`, {
      status,
    });
  }

  generateGroupStage(id: number): Observable<Group[]> {
    return this.http.post<Group[]>(`${this.baseUrl}/${id}/draw`, {});
  }

  generateKnockoutStage(id: number): Observable<Match[]> {
    return this.http.post<Match[]>(`${this.baseUrl}/${id}/knockout`, {});
  }

  advanceKnockoutRound(id: number): Observable<Match[]> {
    return this.http.post<Match[]>(`${this.baseUrl}/${id}/knockout/advance`, {});
  }

  getAwardSuggestions(id: number): Observable<AwardSuggestion[]> {
    return this.http.get<AwardSuggestion[]>(`${this.baseUrl}/${id}/awards/suggestions`);
  }

  createAward(id: number, playerId: number, tip: AwardType): Observable<Award> {
    return this.http.post<Award>(`${this.baseUrl}/${id}/awards`, { player_id: playerId, tip });
  }

  update(id: number, payload: Partial<CreateTournamentPayload>): Observable<Tournament> {
    return this.http.patch<Tournament>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
