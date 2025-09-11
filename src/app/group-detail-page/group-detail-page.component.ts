import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ExpenseService } from '../services/expense.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UserNavComponent } from '../user-nav/user-nav.component';
import { PaymentsService } from '../services/payments.service';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavComponent],
  templateUrl: './group-detail-page.component.html',
  styleUrls: ['./group-detail-page.component.css']
})
export class GroupDetailPageComponent implements OnInit {
  groupId!: number;
  groupName = '';
  groupDescription = '';
  members: any[] = [];
  expenses: any[] = [];
  balances: any = {};
  settlements: any[] = [];

  // ✅ logged in user id
  loggedInUserId: number | null = null;

  // ✅ track form input
  newExpense: any = {
    description: '',
    amount: 0,
    paidById: null
  };

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ check login
    if (this.authService.isLoggedIn()) {
      // 🚨 fix key mismatch ("userId" not "UserId")
      this.loggedInUserId = Number(localStorage.getItem('UserId'));
      console.log(this.loggedInUserId);
      
      // assign logged in user as payer by default
      this.newExpense.paidById = this.loggedInUserId;
    } else {
      // not logged in → redirect
      this.router.navigate(['/login']);
      return;
    }

    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGroupDetails();
    this.loadExpenses();
    this.loadBalances();
    this.loadMembers();
  }

  // ✅ Get group details
  loadGroupDetails() {
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (res: any) => {
        this.groupName = res.name || res.groupName;
        this.groupDescription = res.description || res.groupDescription;
        this.members = res.members || [];
      },
      error: (err) => console.error('Error loading group details', err)
    });
  }

  // ✅ Load members
  loadMembers() {
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (res: any) => {
        this.members = res || [];
      },
      error: (err) => console.error('Error loading members', err)
    });
  }

  // ✅ Get expenses
  loadExpenses() {
    this.expenseService.getExpensesByGroup(this.groupId).subscribe({
      next: (res) => {
        this.expenses = res;
      },
      error: (err) => console.error('Error loading expenses', err)
    });
  }

// ✅ Add new expense
addExpense() {
  // Validate description
  if (!this.newExpense.description || this.newExpense.description.trim().length === 0) {
    alert('⚠️ Description is required.');
    return;
  }

  // Validate amount
  if (!this.newExpense.amount || this.newExpense.amount <= 0) {
    alert('⚠️ Please enter a valid amount greater than 0.');
    return;
  }

  const payload = {
    ...this.newExpense,
    groupId: this.groupId,
    paidById: this.loggedInUserId   // enforce current user
  };

  this.expenseService.addExpense(payload).subscribe({
    next: () => {
      alert('✅ Expense added successfully!');
      this.newExpense = {
        description: '',
        amount: 0,
        paidById: this.loggedInUserId
      };
      this.loadExpenses();
      this.loadBalances();
    },
    error: (err) => console.error('Error adding expense', err)
  });
}


  // ✅ Get balances + settlements
  loadBalances() {
    this.expenseService.getBalances(this.groupId).subscribe({
      next: (res: any) => {
        this.balances = res.balances;
        this.settlements = res.settlements;
      },
      error: (err) => console.error('Error loading balances', err)
    });
  }

  // ✅ Get username from members
  getUserName(userId: number): string {
    const user = this.members.find((m) => m.id === userId);
    return user ? user.username : `User ${userId}`;
  }

  // ✅ Pay Now action (only for logged in user)
 // ✅ Pay Now action (redirect to payments page with settlement info)
payNow(settlement: any) {
  if (settlement.fromUserId !== this.loggedInUserId) {
    alert('⚠️ You can only pay your own dues.');
    return;
  }
 
  this.router.navigate(['/payments', this.groupId], { 
      queryParams: { 
        fromUserId: settlement.fromUserId, 
        toUserId: settlement.toUserId,
        
      } 
    }
    
  );
}

}
