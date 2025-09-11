import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { error } from 'node:console';
import { UserNavComponent } from '../user-nav/user-nav.component';
import { ExpenseService } from '../services/expense.service';

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
  userBalance?: number;
  totalExpenses?: number;
}

@Component({
  imports: [CommonModule, FormsModule, UserNavComponent],
  standalone: true,
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css']
})
export class UserHomeComponent implements OnInit {

  groups: Group[] = [];
  userId: number = 0;

  constructor(
    private groupService: GroupService,
    private userService: UsersService,
    private authService: AuthService,
    private router: Router,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    // ✅ use the same key name as in LoginComponent ("UserId")
    const storedUserId = localStorage.getItem('UserId');
    if (storedUserId) {
      this.userId = Number(storedUserId);
      this.loadUserGroups();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // ✅ Load groups for this user
  loadUserGroups() {
    this.userService.getGroupsByUserId(this.userId).subscribe({
      next: (res) => {
        this.groups = res as Group[];
        this.groups.forEach((g) => this.loadGroupBalance(g));
      },
      error: (err) => {
        console.error('Error fetching user groups', err);
      }
    });
  }

  // ✅ Get balance summary for current user in each group
loadGroupBalance(group: any) {
  this.expenseService.getBalances(group.id).subscribe({
    next: (res: any) => {
      // res.balances is an object with userId as keys
      const balances = res.balances;
      // pick the balance of current user
      const userBalance = balances[this.userId];

      group.userBalance = userBalance ?? 0;

      // Still fetch expenses to calculate total
      this.loadGroupExpenses(group);
    },
    error: (err) => {
      console.error(`Error fetching balances for group ${group.id}`, err);
    }
  });
}


  // ✅ Get total expenses for group
  loadGroupExpenses(group: Group) {
    this.expenseService.getExpensesByGroup(group.id).subscribe({
      next: (expenses: any[]) => {
        group.totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      },
      error: (err) => {
        console.error(`Error fetching expenses for group ${group.id}`, err);
      }
    });
  }

  // ✅ Navigate to Group Detail Page
  openGroup(groupId: number) {
    
    this.router.navigate(['/group-detail', groupId]);
  }
}
