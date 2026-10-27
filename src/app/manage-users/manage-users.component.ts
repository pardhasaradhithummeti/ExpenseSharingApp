import { Component, OnInit } from '@angular/core';
import { UsersService } from '../services/users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { User } from '../models';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = '';
  isLoading = true;

  // Add User Modal
  showAddUserModal = false;
  newUser = {
    username: '',
    email: '',
    password: '',
    isAdmin: false
  };
  isSubmitting = false;

  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.isLoading = false;
        this.toastService.error('Failed to load users list.');
      }
    });
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredUsers = this.users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  openAddUser() {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      isAdmin: false
    };
    this.showAddUserModal = true;
  }

  closeAddUser() {
    this.showAddUserModal = false;
    this.isSubmitting = false;
  }

  addUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.toastService.warning('Please fill in all user fields.');
      return;
    }

    this.isSubmitting = true;
    this.authService.register(
      this.newUser.username.trim(),
      this.newUser.email.trim(),
      this.newUser.password,
      this.newUser.isAdmin
    ).subscribe({
      next: (res) => {
        this.toastService.success(`User "${this.newUser.username}" created successfully!`);
        this.isSubmitting = false;
        this.closeAddUser();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error adding user', err);
        this.isSubmitting = false;
        this.toastService.error(err.error?.message || 'Failed to create user.');
      }
    });
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}