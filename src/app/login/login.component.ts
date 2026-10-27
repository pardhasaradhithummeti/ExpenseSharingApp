import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Mode: 'login' | 'register'
  isLoginMode = true;

  // Form Fields
  email = '';
  password = '';
  username = '';
  isAdmin = false;
  showPassword = false;

  // State
  isLoading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  toggleMode(mode: 'login' | 'register') {
    this.isLoginMode = (mode === 'login');
    this.error = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Quick fill helper for testers
  fillCredentials(type: 'user' | 'admin') {
    if (type === 'admin') {
      this.email = 'adminmaster@expensetracker.com';
      this.password = 'Admin@123';
    } else {
      this.email = 'john@example.com';
      this.password = 'Password@123';
    }
    this.isLoginMode = true;
    this.error = '';
  }

  onSubmit() {
    this.error = '';
    this.isLoading = true;

    if (this.isLoginMode) {
      this.onLogin();
    } else {
      this.onRegister();
    }
  }

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res: { token: string; isAdmin: boolean; username?: string }) => {
        this.isLoading = false;
        this.toastService.success(`Welcome back, ${res.username || 'User'}!`);
        if (res.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(this.error);
      }
    });
  }

  onRegister() {
    if (!this.username.trim()) {
      this.error = 'Username is required.';
      this.isLoading = false;
      return;
    }

    this.authService.register(this.username, this.email, this.password, this.isAdmin).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.toastService.success('Registration successful! Please sign in with your credentials.');
        this.isLoginMode = true;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Registration failed. Try again.';
        this.toastService.error(this.error);
      }
    });
  }
}
