import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:44352/api/Auth';
  user: User | null = null;

  constructor(private http: HttpClient, private router: Router) {
    if (this.isBrowser()) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored user', e);
        }
      }
    }
  }

  // ✅ Ensure localStorage works only in browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  // 🔹 Login user
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          this.saveToken(res.token);
          this.saveUser(res);
        }
      })
    );
  }

  // 🔹 Register new user
  register(username: string, email: string, password: string, isAdmin = false): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { username, email, password, isAdmin });
  }

  // 🔹 Save JWT in browser
  saveToken(token: string) {
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
    }
  }

  // 🔹 Save User object in browser
  saveUser(user: any) {
    this.user = user;
    if (this.isBrowser()) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  // 🔹 Get current user
  getUser(): User | null {
    if (!this.user && this.isBrowser()) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
    }
    return this.user;
  }

  // 🔹 Get JWT from browser
  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('token') : null;
  }

  // 🔹 Check if user is admin
  isAdmin(): boolean {
    const u = this.getUser();
    return !!u?.isAdmin;
  }

  // 🔹 Logout
  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.user = null;
    this.router.navigate(['/login']);
    console.log('Logged out successfully');
  }

  // 🔹 Check login status
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }
}
