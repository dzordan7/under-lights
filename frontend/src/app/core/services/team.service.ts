import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Team, Player, TeamTournament } from '../models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/teams`;

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  getOne(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  create(naziv: string, logo_url?: string): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, { naziv, logo_url });
  }

  getPlayers(teamId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.baseUrl}/${teamId}/players`);
  }

  getMyTeam(kapitenId: number): Observable<Team | undefined> {
    return this.getAll().pipe(map((teams) => teams.find((t) => t.kapiten?.id === kapitenId)));
  }

  getRegistrations(teamId: number): Observable<TeamTournament[]> {
    return this.http.get<TeamTournament[]>(`${this.baseUrl}/${teamId}/registrations`);
  }
}
