import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private url = 'https://localhost:44352/api/Group';
  private token = '';

  constructor(private http: HttpClient, private authService: AuthService) {
    this.token = this.authService.getToken() || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`
    };
  }

  getAllGroups() {
    return this.http.get(`${this.url}/GetAllGroups`, { headers: this.headers });
  }

  getGroupById(id: number) {
    return this.http.get(`${this.url}/${id}`, );
  }

  addGroup(group: any) {
    return this.http.post(`${this.url}/CreateGroup`, group, { headers: this.headers });
  }

  addUserToGroup(groupName: string, email: string) {
    return this.http.post(
      `${this.url}/AddUserToGroup`,
      { groupName, email },
      { headers: this.headers, responseType: 'text' }
    );
  }

  getGroupMembers(id: number) {
    return this.http.get(`${this.url}/GetGroupMembers/${id}`, { headers: this.headers });
  }
}
