import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { TeamActions } from '../../../store/teams/team.actions';
import { selectAllTeams } from '../../../store/teams/team.selectors';
import { selectTeamsLoading } from '../../../store/teams/team.reducer';

@Component({
  selector: 'app-team-list',
  imports: [RouterLink],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
})
export class TeamList implements OnInit {
  private store = inject(Store);

  teams = this.store.selectSignal(selectAllTeams);
  loading = this.store.selectSignal(selectTeamsLoading);

  ngOnInit() {
    this.store.dispatch(TeamActions.loadTeams());
  }
}
