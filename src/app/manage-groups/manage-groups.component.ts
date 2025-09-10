import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { GroupService } from '../services/group.service';
import { nextTick } from 'process';
import { error } from 'console';

@Component({
  selector: 'app-manage-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './manage-groups.component.html',
  styleUrls: ['./manage-groups.component.css']
})
export class ManageGroupsComponent implements OnInit {
  groups: any[] = [];
  newGroup = {
    name: '',
    description: ''
  };
  selectedGroup: string = '';
  userEmail: string = '';
  constructor(private groupService: GroupService) { }
  ngOnInit() {
    this.getGroups();
  }

  addGroup() {
    if (this.newGroup.name) {
      this.groupService.addGroup(this.newGroup).subscribe((group) => {
        this.groups.push(group);
        this.newGroup.name = '';
        this.newGroup.description = '';
      });
    }
  }
  getGroups() {
    this.groupService.getAllGroups().subscribe((data: any) => {
      this.groups = data;
    });
}
addUserToGroup(groupName: string, email: string) {
  

  this.groupService.addUserToGroup(groupName, email).subscribe({
    next: (res) => {
      console.log(`User ${email} added to group ${groupName}`, res);
      this.userEmail = '';
      this.selectedGroup = '';
    },
    error: (err) => {
      console.error('Error adding user to group', err);
    }
  });
}
}