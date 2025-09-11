import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LoginResponse {
  token: string;
  isAdmin: boolean;
  id: string;   // ✅ added id so it matches what you use
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res: LoginResponse) => {
        console.log('Login successful', res);

        // ✅ Save user info
        this.authService.user = res;
        localStorage.setItem('UserId', res.id);
        this.authService.saveToken(res.token);

        // ✅ Redirect
        if (res.isAdmin) {
          console.log('Navigating to admin home');
          this.router.navigate(['/admin']);
        } else {
          console.log('Navigating to user home');
          this.router.navigate(['/user']);
        }
      },
      error: (err: { error: { message?: string } }) => {
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}
