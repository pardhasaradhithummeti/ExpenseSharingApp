import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Group, GroupMember } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  url = 'https://localhost:44352/api/Group';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken() || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.url}/GetAllGroups`, this.getHeaders());
  }

  getGroupById(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.url}/${id}`, this.getHeaders());
  }

  addGroup(group: { name: string; description: string }): Observable<any> {
    return this.http.post(`${this.url}/CreateGroup`, group, this.getHeaders());
  }

  addUserToGroup(groupName: string, email: string): Observable<any> {
    return this.http.post(`${this.url}/AddUserToGroup`, { groupName, email }, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken() || ''}`
      }),
      responseType: 'text'
    });
  }

  getGroupMembers(id: number): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.url}/GetGroupMembers/${id}`, this.getHeaders());
  }
}
