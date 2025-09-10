import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'https://localhost:44352/api/User';
  token  = "";

  constructor(private http: HttpClient , private authService: AuthService) {
    this.token = this.authService.getToken() || '';
    console.log("User Service Token: ", this.token);
  }
  getAllUsers() {
    return this.http.get(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
  }
  getUserById(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/groups`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
  }
  getGroupsByUserId(userId: number) {
  return this.http.get(`${this.apiUrl}/${userId}/groups`, {
    headers: {
      Authorization: `Bearer ${this.token}`
    }
  });
}
}