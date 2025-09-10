import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
      next: (res: { token: string; isAdmin: boolean }) => {
        console.log('Login successful', res);
        this.authService.user = res;
        this.authService.saveToken(res.token);
        if (res.isAdmin) {
          console.log('Navigating to admin home');
          this.router.navigate(['/admin']);
        } else {
          console.log('Navigating to user home');
          this.router.navigate(['/user']); 
        }
      },
      error: (err: { error: { message?: string } }) => {
        this.error = err.error.message || 'Login failed';
      }
    });
  }
}
