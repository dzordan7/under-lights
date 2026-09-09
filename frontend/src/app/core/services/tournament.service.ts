import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tournament, TournamentStatus } from '../models/tournament.model';

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

  register(tournamentId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${tournamentId}/register`, {});
  }
}
