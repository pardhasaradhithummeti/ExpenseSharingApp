import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ExpenseService } from '../services/expense.service';
import { PaymentService } from '../services/payment.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { Group, GroupMember, Expense, Payment, Settlement, GroupBalancesResponse } from '../models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit {
  @ViewChild(AppShellComponent) appShell?: AppShellComponent;

  groupId!: number;
  group: Group | null = null;
  members: GroupMember[] = [];
  expenses: Expense[] = [];
  payments: Payment[] = [];
  balancesData: GroupBalancesResponse | null = null;
  settlements: Settlement[] = [];

  activeTab: 'expenses' | 'balances' | 'payments' | 'members' = 'expenses';
  isLoading = true;

  // Total calculations
  totalSpend = 0;
  userBalance = 0;

  // Add Member Inline state
  newMemberEmail = '';
  isAddingMember = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private paymentService: PaymentService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.groupId = Number(idParam);
        this.loadGroupData();
      }
    });

    window.addEventListener('expenseAdded', () => this.loadGroupData());
    window.addEventListener('paymentRecorded', () => this.loadGroupData());
  }

  loadGroupData() {
    this.isLoading = true;
    const currentUser = this.authService.getUser();
    const currentUserId = currentUser?.id;

    forkJoin({
      group: this.groupService.getGroupById(this.groupId).pipe(catchError(() => of(null))),
      members: this.groupService.getGroupMembers(this.groupId).pipe(catchError(() => of([] as GroupMember[]))),
      expenses: this.expenseService.getExpensesByGroupId(this.groupId).pipe(catchError(() => of([] as Expense[]))),
      balances: this.expenseService.getBalancesByGroupId(this.groupId).pipe(catchError(() => of(null))),
      payments: this.paymentService.getPaymentsByGroupId(this.groupId).pipe(catchError(() => of([] as Payment[])))
    }).subscribe({
      next: (res) => {
        this.group = res.group;
        this.members = res.members || [];
        this.expenses = res.expenses || [];
        this.balancesData = res.balances;
        this.payments = res.payments || [];

        // Calculate total spend
        this.totalSpend = this.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

        // Calculate current user's balance in this group
        if (currentUserId && this.balancesData && this.balancesData.balances) {
          const userVal = this.balancesData.balances[currentUserId.toString()];
          this.userBalance = userVal !== undefined ? Number(userVal) : 0;
        }

        // Map settlements with usernames
        if (this.balancesData && this.balancesData.settlements) {
          this.settlements = this.balancesData.settlements.map(s => {
            const fromM = this.members.find(m => m.id === s.fromUserId);
            const toM = this.members.find(m => m.id === s.toUserId);
            return {
              ...s,
              fromUsername: fromM ? fromM.username : `User #${s.fromUserId}`,
              toUsername: toM ? toM.username : `User #${s.toUserId}`
            };
          });
        } else {
          this.settlements = [];
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading group data', err);
        this.isLoading = false;
      }
    });
  }

  openAddExpense() {
    this.appShell?.openAddExpense(this.groupId);
  }

  openSettleUp(settlement?: Settlement) {
    if (settlement) {
      this.appShell?.openSettleUp(this.groupId, settlement.fromUserId, settlement.toUserId, settlement.amount);
    } else {
      this.appShell?.openSettleUp(this.groupId);
    }
  }

  submitAddMember() {
    if (!this.group || !this.newMemberEmail.trim()) {
      this.toastService.warning('Please enter a valid user email.');
      return;
    }

    this.isAddingMember = true;
    this.groupService.addUserToGroup(this.group.name, this.newMemberEmail.trim()).subscribe({
      next: () => {
        this.toastService.success(`User ${this.newMemberEmail} added to ${this.group?.name}!`);
        this.newMemberEmail = '';
        this.isAddingMember = false;
        this.loadGroupData();
      },
      error: (err) => {
        console.error('Failed to add user to group', err);
        this.isAddingMember = false;
        this.toastService.error('Failed to add user. Verify the email exists in system.');
      }
    });
  }

  getMemberName(userId: number): string {
    const m = this.members.find(mem => mem.id === userId);
    return m ? m.username : `User #${userId}`;
  }

  getMemberBalance(userId: number): number {
    if (this.balancesData?.balances && this.balancesData.balances[userId.toString()] !== undefined) {
      return Number(this.balancesData.balances[userId.toString()]);
    }
    return 0;
  }

  getExpenseCategoryIcon(description?: string): string {
    if (!description) return '💸';
    const desc = description.toLowerCase();
    if (desc.includes('food') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('snack') || desc.includes('snaks') || desc.includes('cafe')) {
      return '🍕';
    }
    if (desc.includes('hotel') || desc.includes('stay') || desc.includes('apartment') || desc.includes('room')) {
      return '🏨';
    }
    if (desc.includes('taxi') || desc.includes('cab') || desc.includes('flight') || desc.includes('travel')) {
      return '🚕';
    }
    if (desc.includes('movie') || desc.includes('ticket') || desc.includes('party')) {
      return '🎬';
    }
    return '💳';
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
