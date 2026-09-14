import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlayerProfile } from '../models/player-profile.model';
import { Award } from '../models/award.model';
import { Player, Position } from '../models/team.model';

export interface PlayerFormData {
  ime: string;
  prezime: string;
  email?: string;
  broj_dresa: number;
  pozicija: Position;
  datum_rodjenja?: string;
  slika_url?: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getProfile(id: number): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.baseUrl}/players/${id}/profile`);
  }

  getAwards(id: number): Observable<Award[]> {
    return this.http.get<Award[]>(`${this.baseUrl}/players/${id}/awards`);
  }

  create(teamId: number, data: PlayerFormData): Observable<Player> {
    return this.http.post<Player>(`${this.baseUrl}/teams/${teamId}/players`, data);
  }

  update(playerId: number, data: Partial<PlayerFormData>): Observable<Player> {
    return this.http.patch<Player>(`${this.baseUrl}/players/${playerId}`, data);
  }

  remove(playerId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/players/${playerId}`);
  }
}
