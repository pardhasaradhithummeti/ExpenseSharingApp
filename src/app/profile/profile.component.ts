import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { User, Group } from '../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  groups: Group[] = [];
  isLoading = true;

  // Settings mock state
  currency = 'INR (₹)';
  dateFormat = 'DD/MM/YYYY';
  emailAlerts = true;
  debtSimplification = true;

  constructor(
    public authService: AuthService,
    private userService: UsersService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user?.id) {
      this.userService.getGroupsByUserId(this.user.id).subscribe({
        next: (groups) => {
          this.groups = groups;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  savePreferences() {
    this.toastService.success('Preferences updated successfully!');
  }

  logout() {
    this.authService.logout();
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
