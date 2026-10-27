import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { GroupService } from '../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { Router, RouterModule } from '@angular/router';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { User, Group } from '../models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  currentUser: User | null = null;
  groups = 0;
  users = 0;
  groupsList: Group[] = [];
  usersList: User[] = [];
  isLoading = true;

  constructor(
    public authService: AuthService,
    private groupService: GroupService,
    private userService: UsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.loadAdminData();
  }

  loadAdminData() {
    this.isLoading = true;
    this.groupService.getAllGroups().subscribe({
      next: (data: Group[]) => {
        this.groups = data.length;
        this.groupsList = data;
        this.checkLoading();
      },
      error: () => this.checkLoading()
    });

    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data.length;
        this.usersList = data;
        this.checkLoading();
      },
      error: () => this.checkLoading()
    });
  }

  private checkLoading() {
    this.isLoading = false;
  }

  openAddGroup() {
    this.router.navigate(['/manage-groups']);
  }

  openAddUser() {
    this.router.navigate(['/manage-users']);
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
