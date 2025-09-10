import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  url = 'https://localhost:44352/api/Group';
  token  = "";
  constructor(private http: HttpClient , private authService : AuthService) {
    this.token = this.authService.getToken() || '';
   }
   getAllGroups(){
    return this.http.get(this.url+'/GetAllGroups', {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
   }
   getGroupById(id: number) {
     return this.http.get(`${this.url}/${id}`, {
       headers: {
         Authorization: `Bearer ${this.token}`
       }
     });
   }
   addGroup(group: any) {
     return this.http.post(this.url+ '/CreateGroup', group, {
       headers: {
         Authorization: `Bearer ${this.token}`
       }
     });
   }
   
   addUserToGroup(groupName: string, email: string) {
      return this.http.post(`${this.url}/AddUserToGroup`, { groupName, email }, { responseType: 'text' });
   }
 
}
