import { Component } from '@angular/core';
import { UsersService } from '../services/users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent {
  users: any[] = [];
  newUser = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private userService: UsersService , private groupService: GroupService , private service : AuthService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe((data: any) => {
      this.users = data;
    });
  }

  addUser() {
    if (this.newUser.username && this.newUser.email && this.newUser.password) {
      // Call your service to add the user
      // For demonstration, we'll just log the new user and reset the form
      console.log('Adding user:', this.newUser);
      // Reload users list
      this.service.register(this.newUser.username, this.newUser.email, this.newUser.password).subscribe({
        next: (res) => {
          console.log('User added successfully', res);
          this.loadUsers();
        }
      });
    }
  }

}