import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../services/users.service';
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';
import { ExpenseService } from '../services/expense.service';
import { PaymentService } from '../services/payment.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { User, Group, Expense, Payment, Settlement, GroupMember } from '../models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EnrichedGroup extends Group {
  totalExpenseAmount: number;
  userBalance: number;
  members: GroupMember[];
  expensesCount: number;
}

export interface ActivityItem {
  id: number;
  type: 'expense' | 'payment';
  title: string;
  groupName: string;
  groupId: number;
  amount: number;
  date: string;
  isPayer: boolean;
  payerName: string;
  recipientName?: string;
  userShare?: number;
  description?: string;
  icon: string;
}

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css']
})
export class UserHomeComponent implements OnInit, OnDestroy {
  @ViewChild(AppShellComponent) appShell?: AppShellComponent;

  user: User | null = null;
  isLoading = true;

  // Financial Stats
  totalExpenses = 0;
  owe = 0;
  receive = 0;
  netBalance = 0;

  // Data Collections
  groups: EnrichedGroup[] = [];
  recentActivities: ActivityItem[] = [];
  outstandingSettlements: Settlement[] = [];

  // Group creation modal state
  showCreateGroupModal = false;
  newGroupName = '';
  newGroupDescription = '';
  isCreatingGroup = false;

  private expenseListener = () => this.loadDashboardData();
  private paymentListener = () => this.loadDashboardData();

  constructor(
    private groupService: GroupService,
    private userService: UsersService,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private paymentService: PaymentService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    if (!this.user || !this.user.id) {
      // Try to recover user or redirect
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
        return;
      }
    }

    this.loadDashboardData();

    window.addEventListener('expenseAdded', this.expenseListener);
    window.addEventListener('paymentRecorded', this.paymentListener);
  }

  ngOnDestroy() {
    window.removeEventListener('expenseAdded', this.expenseListener);
    window.removeEventListener('paymentRecorded', this.paymentListener);
  }

  loadDashboardData() {
    this.isLoading = true;
    this.user = this.authService.getUser();
    const currentUserId = this.user?.id;

    if (!currentUserId) {
      this.isLoading = false;
      return;
    }

    // 1. Get user's groups
    this.userService.getGroupsByUserId(currentUserId).pipe(
      catchError((err) => {
        console.error('Error fetching user groups:', err);
        return of([] as Group[]);
      })
    ).subscribe((userGroups) => {
      // If user has no assigned groups, check all groups (e.g. for admin/new users)
      if (userGroups.length === 0 && this.user?.isAdmin) {
        this.groupService.getAllGroups().subscribe({
          next: (allGroups) => this.processGroups(allGroups, currentUserId),
          error: () => {
            this.groups = [];
            this.isLoading = false;
          }
        });
      } else {
        this.processGroups(userGroups, currentUserId);
      }
    });
  }

  private processGroups(rawGroups: Group[], currentUserId: number) {
    if (!rawGroups || rawGroups.length === 0) {
      this.groups = [];
      this.isLoading = false;
      this.resetStats();
      return;
    }

    const groupRequests = rawGroups.map((g) => {
      return forkJoin({
        group: of(g),
        members: this.groupService.getGroupMembers(g.id).pipe(catchError(() => of([] as GroupMember[]))),
        expenses: this.expenseService.getExpensesByGroupId(g.id).pipe(catchError(() => of([] as Expense[]))),
        balances: this.expenseService.getBalancesByGroupId(g.id).pipe(catchError(() => of(null))),
        payments: this.paymentService.getPaymentsByGroupId(g.id).pipe(catchError(() => of([] as Payment[])))
      });
    });

    forkJoin(groupRequests).subscribe({
      next: (results) => {
        let totalExp = 0;
        let totalOwe = 0;
        let totalReceive = 0;
        const allActivities: ActivityItem[] = [];
        const allSettlements: Settlement[] = [];
        const enrichedGroups: EnrichedGroup[] = [];

        results.forEach((res) => {
          const g = res.group;
          const members = res.members || [];
          const expenses = res.expenses || [];
          const balances = res.balances;
          const payments = res.payments || [];

          // Group totals
          const groupSpend = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          totalExp += groupSpend;

          // User's balance in this group
          let userBal = 0;
          if (balances && balances.balances && balances.balances[currentUserId.toString()] !== undefined) {
            userBal = Number(balances.balances[currentUserId.toString()]);
          }

          if (userBal > 0) {
            totalReceive += userBal;
          } else if (userBal < 0) {
            totalOwe += Math.abs(userBal);
          }

          // Settlements relevant to current user
          if (balances && balances.settlements) {
            balances.settlements.forEach((s) => {
              const fromMember = members.find(m => m.id === s.fromUserId);
              const toMember = members.find(m => m.id === s.toUserId);
              allSettlements.push({
                ...s,
                fromUsername: fromMember ? fromMember.username : `User #${s.fromUserId}`,
                toUsername: toMember ? toMember.username : `User #${s.toUserId}`
              });
            });
          }

          // Activity: Expenses
          expenses.forEach((e) => {
            const payer = members.find(m => m.id === e.paidById);
            const isPayer = (e.paidById === currentUserId);
            const memberCount = Math.max(members.length, 1);
            const share = Number((e.amount / memberCount).toFixed(2));

            allActivities.push({
              id: e.id || Math.random(),
              type: 'expense',
              title: e.description || 'Expense',
              groupName: g.name,
              groupId: g.id,
              amount: Number(e.amount),
              date: e.createdAt || new Date().toISOString(),
              isPayer: isPayer,
              payerName: isPayer ? 'You' : (payer?.username || `User #${e.paidById}`),
              userShare: share,
              icon: this.getExpenseCategoryIcon(e.description)
            });
          });

          // Activity: Payments
          payments.forEach((p) => {
            const fromM = members.find(m => m.id === p.fromUserId);
            const toM = members.find(m => m.id === p.toUserId);
            const isFromUser = (p.fromUserId === currentUserId);
            const isToUser = (p.toUserId === currentUserId);

            allActivities.push({
              id: p.id || Math.random(),
              type: 'payment',
              title: isFromUser ? `Paid to ${toM?.username || 'member'}` : `Received from ${fromM?.username || 'member'}`,
              groupName: g.name,
              groupId: g.id,
              amount: Number(p.amount),
              date: p.createdAt || new Date().toISOString(),
              isPayer: isFromUser,
              payerName: isFromUser ? 'You' : (fromM?.username || `User #${p.fromUserId}`),
              recipientName: isToUser ? 'You' : (toM?.username || `User #${p.toUserId}`),
              icon: '🤝'
            });
          });

          enrichedGroups.push({
            ...g,
            totalExpenseAmount: groupSpend,
            userBalance: userBal,
            members: members,
            expensesCount: expenses.length,
            memberCount: members.length || g.memberCount || 1
          });
        });

        // Sort activities by date descending
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.groups = enrichedGroups;
        this.totalExpenses = totalExp;
        this.owe = Number(totalOwe.toFixed(2));
        this.receive = Number(totalReceive.toFixed(2));
        this.netBalance = Number((this.receive - this.owe).toFixed(2));
        this.recentActivities = allActivities.slice(0, 8);
        this.outstandingSettlements = allSettlements;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error processing dashboard data', err);
        this.isLoading = false;
      }
    });
  }

  private resetStats() {
    this.totalExpenses = 0;
    this.owe = 0;
    this.receive = 0;
    this.netBalance = 0;
    this.recentActivities = [];
    this.outstandingSettlements = [];
  }

  openGroup(groupId: number) {
    this.router.navigate(['/groups', groupId]);
  }

  openAddExpense(groupId?: number) {
    this.appShell?.openAddExpense(groupId);
  }

  openSettleUp(settlement?: Settlement) {
    if (settlement) {
      this.appShell?.openSettleUp(undefined, settlement.fromUserId, settlement.toUserId, settlement.amount);
    } else {
      this.appShell?.openSettleUp();
    }
  }

  // --- Group Creation Modal ---
  openCreateGroup() {
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.showCreateGroupModal = true;
  }

  closeCreateGroup() {
    this.showCreateGroupModal = false;
    this.isCreatingGroup = false;
  }

  submitCreateGroup() {
    if (!this.newGroupName.trim()) {
      this.toastService.warning('Group name is required.');
      return;
    }

    this.isCreatingGroup = true;
    this.groupService.addGroup({
      name: this.newGroupName.trim(),
      description: this.newGroupDescription.trim()
    }).subscribe({
      next: (created) => {
        this.toastService.success(`Group "${this.newGroupName}" created successfully!`);
        this.isCreatingGroup = false;
        this.closeCreateGroup();

        // Also add current user to this new group if not automatically added
        if (this.user?.email) {
          this.groupService.addUserToGroup(this.newGroupName.trim(), this.user.email).subscribe({
            next: () => this.loadDashboardData(),
            error: () => this.loadDashboardData()
          });
        } else {
          this.loadDashboardData();
        }
      },
      error: (err) => {
        console.error('Failed to create group', err);
        this.isCreatingGroup = false;
        this.toastService.error('Failed to create group. Please try again.');
      }
    });
  }

  getExpenseCategoryIcon(description?: string): string {
    if (!description) return '💸';
    const desc = description.toLowerCase();
    if (desc.includes('food') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || desc.includes('snack') || desc.includes('snaks') || desc.includes('cafe')) {
      return '🍕';
    }
    if (desc.includes('hotel') || desc.includes('stay') || desc.includes('room') || desc.includes('apartment') || desc.includes('rent')) {
      return '🏨';
    }
    if (desc.includes('taxi') || desc.includes('cab') || desc.includes('flight') || desc.includes('train') || desc.includes('bus') || desc.includes('travel') || desc.includes('fuel')) {
      return '🚕';
    }
    if (desc.includes('movie') || desc.includes('ticket') || desc.includes('party') || desc.includes('beer') || desc.includes('drink')) {
      return '🎬';
    }
    if (desc.includes('grocery') || desc.includes('market') || desc.includes('shopping')) {
      return '🛒';
    }
    return '💳';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }
}
