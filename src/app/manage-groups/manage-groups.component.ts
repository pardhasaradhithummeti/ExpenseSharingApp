import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { Group } from '../models';

@Component({
  selector: 'app-manage-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './manage-groups.component.html',
  styleUrls: ['./manage-groups.component.css']
})
export class ManageGroupsComponent implements OnInit {
  groups: Group[] = [];
  filteredGroups: Group[] = [];
  searchQuery = '';
  isLoading = true;

  // Add Group Modal
  showAddGroupModal = false;
  newGroup = {
    name: '',
    description: ''
  };
  isCreating = false;

  // Add User to Group Modal
  showAssignUserModal = false;
  selectedGroup: string = '';
  userEmail: string = '';
  isAssigning = false;

  constructor(
    private groupService: GroupService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.getGroups();
  }

  getGroups() {
    this.isLoading = true;
    this.groupService.getAllGroups().subscribe({
      next: (data: Group[]) => {
        this.groups = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching groups', err);
        this.isLoading = false;
        this.toastService.error('Failed to load groups.');
      }
    });
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groups];
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredGroups = this.groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  }

  // --- Add Group ---
  openAddGroup() {
    this.newGroup = { name: '', description: '' };
    this.showAddGroupModal = true;
  }

  closeAddGroup() {
    this.showAddGroupModal = false;
    this.isCreating = false;
  }

  addGroup() {
    if (!this.newGroup.name.trim()) {
      this.toastService.warning('Group name is required.');
      return;
    }

    this.isCreating = true;
    this.groupService.addGroup({
      name: this.newGroup.name.trim(),
      description: this.newGroup.description.trim()
    }).subscribe({
      next: (created) => {
        this.toastService.success(`Group "${this.newGroup.name}" created successfully!`);
        this.closeAddGroup();
        this.getGroups();
      },
      error: (err) => {
        console.error('Error creating group', err);
        this.isCreating = false;
        this.toastService.error('Failed to create group.');
      }
    });
  }

  // --- Assign User to Group ---
  openAssignUser(groupName?: string) {
    this.selectedGroup = groupName || (this.groups[0] ? this.groups[0].name : '');
    this.userEmail = '';
    this.showAssignUserModal = true;
  }

  closeAssignUser() {
    this.showAssignUserModal = false;
    this.isAssigning = false;
  }

  addUserToGroup(groupName: string, email: string) {
    if (!groupName || !email.trim()) {
      this.toastService.warning('Please select a group and enter a user email.');
      return;
    }

    this.isAssigning = true;
    this.groupService.addUserToGroup(groupName, email.trim()).subscribe({
      next: (res) => {
        this.toastService.success(`User ${email} added to ${groupName}!`);
        this.closeAssignUser();
        this.getGroups();
      },
      error: (err) => {
        console.error('Error adding user to group', err);
        this.isAssigning = false;
        this.toastService.error('Failed to add user to group. Check email.');
      }
    });
  }
}