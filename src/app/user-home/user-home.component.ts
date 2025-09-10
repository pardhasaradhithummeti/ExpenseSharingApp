import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
}

interface Group {
  id: number;
  name: string;
  memberCount?: number;
}

@Component({
  imports: [CommonModule, FormsModule],
  standalone: true,
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css']
})
export class UserHomeComponent implements OnInit {
  user!: User;   // logged in user
  owe = 0;
  receive = 0;
  groups: Group[] = [];

  constructor(
    private groupService: GroupService,
    private userService: UsersService,
    private authService: AuthService
  ) {
    // ✅ Get logged in user from AuthService
    this.user = this.authService.user as User;
    console.log('Logged in User: ', this.user);
  }

  ngOnInit() {
    if (this.user && this.user.id) {
      this.userService.getGroupsByUserId(this.user.id).subscribe(
        (data) => {
          this.groups = data as Group[];
          console.log('User Groups: ', this.groups);
        },
        (err) => {
          console.error('Error fetching user groups', err);
        }
      );
    }
  }

  openGroup(groupId: number) {
    console.log('Opening group:', groupId);
    // TODO: navigate to group detail page
  }
}
