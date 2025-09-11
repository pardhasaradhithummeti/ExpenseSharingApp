import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { GroupService } from '../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  name = '';
  groups:any;
  users:any;
  groupsList:any[] = [];
  usersList:any[] = [];

    constructor(private service: AuthService , private groupService:GroupService , private userService : UsersService , private router : Router) { }
  ngOnInit() {
    this.groupService.getAllGroups().subscribe((data: any) => {
      this.groups = (data as any[]).length;
      this.groupsList = data as any[];
    });

    this.userService.getAllUsers().subscribe((data: any) => {
      this.users = (data as any[]).length;
      this.usersList = data as any[];
    });
  }

  openAddUser(){
    this.router.navigate(['/manage-users'])
  }

  openAddGroup() {
    this.router.navigate(['/manage-groups']);
  }
  
}
