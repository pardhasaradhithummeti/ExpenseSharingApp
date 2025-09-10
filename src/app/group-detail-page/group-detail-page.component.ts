import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ExpenseService } from '../services/expense.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-detail-page.component.html',
  styleUrls: ['./group-detail-page.component.css']
})
export class GroupDetailPageComponent implements OnInit {
  groupId!: number;
  group: any = {};
  members: any[] = [];
  expenses: any[] = [];
  balances: any[] = [];

  constructor(private route: ActivatedRoute, private groupService: GroupService, private expenseService: ExpenseService, private authService : AuthService , private router: Router) {}

  ngOnInit(): void {
    // ✅ Get id from route parameter
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));

    // ✅ Fetch group members
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (data: any) => {
        this.members = data;
        console.log('Members:', this.members);
      },
      error: (err) => console.error(err)
    });

    // ✅ Fetch expenses
    this.expenseService.getExpensesByGroup(this.groupId).subscribe({
      next: (data: any) => {
        this.expenses = data;

        // Calculate total expenses
        this.group.totalExpenses = this.expenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );
      },
      error: (err) => console.error(err)
    });

    // ✅ Fetch balances/settlements
    this.expenseService.getBalances(this.groupId).subscribe({
      next: (data: any) => {
        this.balances = data.settlements || [];

        // Example: calculate current user owe/get (replace with logged-in user ID)
        const currentUserId = 2; // 👈 TODO: inject AuthService to get logged in user
        this.group.youOwe = this.balances
          .filter((b) => b.fromUserId === currentUserId)
          .reduce((sum, b) => sum + b.amount, 0);

        this.group.youReceive = this.balances
          .filter((b) => b.toUserId === currentUserId)
          .reduce((sum, b) => sum + b.amount, 0);
      },
      error: (err) => console.error(err)
    });
  }

  // ✅ Helper to map userId → username
  getUserName(userId: number): string {
    const user = this.members.find((m) => m.id === userId);
    return user ? user.username : `User ${userId}`;
  }
  back(){
    this.router.navigate(['/user-home']);
  }
}
