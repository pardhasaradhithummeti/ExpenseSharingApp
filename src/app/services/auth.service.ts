import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:44352/api/Auth';
  user : any = null;
  constructor(private http: HttpClient, private router: Router) {}

  // ✅ Ensure localStorage works only in browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  // 🔹 Login user
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  // 🔹 Register new user
  register(username: string, email: string, password: string, isAdmin = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password, isAdmin });
  }

  // 🔹 Save JWT in browser
  saveToken(token: string) {
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
    }
  }

  // 🔹 Get JWT from browser
  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('token') : null;
  }

  // 🔹 Logout
  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
    console.log('Logged out successfully');
  }

  // 🔹 Check login status
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }
}
