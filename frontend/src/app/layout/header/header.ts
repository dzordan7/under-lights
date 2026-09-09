import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  authService = inject(AuthService);
  meniOtvoren = signal(false);

  toggleMeni() {
    this.meniOtvoren.update((v) => !v);
  }

  zatvoriMeni() {
    this.meniOtvoren.set(false);
  }

  logout() {
    this.authService.logout();
    this.zatvoriMeni();
  }
}
