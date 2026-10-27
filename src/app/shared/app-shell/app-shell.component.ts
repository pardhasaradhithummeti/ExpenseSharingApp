import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { ExpenseService } from '../../services/expense.service';
import { PaymentService } from '../../services/payment.service';
import { ToastService } from '../../services/toast.service';
import { User, Group, GroupMember } from '../../models';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css']
})
export class AppShellComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  mobileMenuOpen = false;
  userMenuOpen = false;
  searchQuery = '';

  // Global modals
  showAddExpenseModal = false;
  showSettleUpModal = false;

  // Add Expense form state
  userGroups: Group[] = [];
  selectedGroupId: number | null = null;
  groupMembers: GroupMember[] = [];
  expenseDescription = '';
  expenseAmount: number | null = null;
  expensePaidById: number | null = null;
  isSubmittingExpense = false;

  // Settle Up form state
  settleGroupId: number | null = null;
  settleFromUserId: number | null = null;
  settleToUserId: number | null = null;
  settleAmount: number | null = null;
  isSubmittingSettle = false;

  private routerSub?: Subscription;

  constructor(
    public authService: AuthService,
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private paymentService: PaymentService,
    private toastService: ToastService,
    public router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.isAdmin = this.authService.isAdmin();

    // Close menus on navigation
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this.userMenuOpen = false;
      });

    this.loadUserGroups();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  loadUserGroups() {
    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.userGroups = groups;
      },
      error: (err) => console.error('Failed to load groups for shell modal', err)
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  // --- Add Expense Modal Workflow ---
  openAddExpense(preselectedGroupId?: number) {
    this.currentUser = this.authService.getUser();
    this.showAddExpenseModal = true;
    this.expenseDescription = '';
    this.expenseAmount = null;

    if (this.userGroups.length === 0) {
      this.loadUserGroups();
    }

    if (preselectedGroupId) {
      this.selectedGroupId = preselectedGroupId;
      this.onGroupChanged();
    } else if (this.userGroups.length > 0) {
      this.selectedGroupId = this.userGroups[0].id;
      this.onGroupChanged();
    } else {
      this.selectedGroupId = null;
    }
  }

  closeAddExpense() {
    this.showAddExpenseModal = false;
    this.isSubmittingExpense = false;
  }

  onGroupChanged() {
    if (!this.selectedGroupId) return;
    this.groupService.getGroupMembers(this.selectedGroupId).subscribe({
      next: (members) => {
        this.groupMembers = members;
        // Default paidBy to current logged-in user if member of group
        const currentUserId = this.currentUser?.id;
        const isCurrentMember = members.some(m => m.id === currentUserId);
        if (isCurrentMember && currentUserId) {
          this.expensePaidById = currentUserId;
        } else if (members.length > 0) {
          this.expensePaidById = members[0].id;
        }
      },
      error: (err) => {
        console.error('Failed to load group members', err);
        this.groupMembers = [];
        if (this.currentUser?.id) {
          this.expensePaidById = this.currentUser.id;
        }
      }
    });
  }

  submitExpense() {
    if (!this.selectedGroupId || !this.expenseDescription || !this.expenseAmount || !this.expensePaidById) {
      this.toastService.warning('Please fill in all expense details.');
      return;
    }

    this.isSubmittingExpense = true;
    this.expenseService.createExpense({
      description: this.expenseDescription.trim(),
      amount: Number(this.expenseAmount),
      paidById: Number(this.expensePaidById),
      groupId: Number(this.selectedGroupId)
    }).subscribe({
      next: (res) => {
        this.toastService.success(`Expense "${this.expenseDescription}" added successfully!`);
        this.isSubmittingExpense = false;
        this.closeAddExpense();
        // If current route is user dashboard, groups, or expenses, trigger reload
        window.dispatchEvent(new CustomEvent('expenseAdded', { detail: res }));
      },
      error: (err) => {
        console.error('Failed to create expense', err);
        this.isSubmittingExpense = false;
        this.toastService.error('Failed to add expense. Please try again.');
      }
    });
  }

  // --- Settle Up Modal Workflow ---
  openSettleUp(groupId?: number, fromUserId?: number, toUserId?: number, amount?: number) {
    this.currentUser = this.authService.getUser();
    this.showSettleUpModal = true;
    this.settleGroupId = groupId || (this.userGroups[0] ? this.userGroups[0].id : null);
    this.settleFromUserId = fromUserId || (this.currentUser ? this.currentUser.id : null);
    this.settleToUserId = toUserId || null;
    this.settleAmount = amount || null;

    if (this.settleGroupId) {
      this.onSettleGroupChanged();
    }
  }

  closeSettleUp() {
    this.showSettleUpModal = false;
    this.isSubmittingSettle = false;
  }

  onSettleGroupChanged() {
    if (!this.settleGroupId) return;
    this.groupService.getGroupMembers(this.settleGroupId).subscribe({
      next: (members) => {
        this.groupMembers = members;
      },
      error: (err) => console.error('Failed to load group members for settlement', err)
    });
  }

  submitSettleUp() {
    if (!this.settleGroupId || !this.settleFromUserId || !this.settleToUserId || !this.settleAmount) {
      this.toastService.warning('Please fill in all payment details.');
      return;
    }

    if (this.settleFromUserId === this.settleToUserId) {
      this.toastService.warning('Payer and payee cannot be the same user.');
      return;
    }

    this.isSubmittingSettle = true;
    this.paymentService.createPayment({
      amount: Number(this.settleAmount),
      fromUserId: Number(this.settleFromUserId),
      toUserId: Number(this.settleToUserId),
      groupId: Number(this.settleGroupId)
    }).subscribe({
      next: (payment) => {
        // Complete the payment automatically if backend provides id
        if (payment && payment.id) {
          this.paymentService.completePayment(payment.id).subscribe({
            next: () => {
              this.toastService.success(`Payment of ₹${this.settleAmount} recorded and marked completed!`);
              this.finishSettle(payment);
            },
            error: () => {
              this.toastService.success(`Payment of ₹${this.settleAmount} recorded.`);
              this.finishSettle(payment);
            }
          });
        } else {
          this.toastService.success(`Payment of ₹${this.settleAmount} recorded successfully!`);
          this.finishSettle(payment);
        }
      },
      error: (err) => {
        console.error('Failed to record payment', err);
        this.isSubmittingSettle = false;
        this.toastService.error('Failed to record payment. Please check details.');
      }
    });
  }

  private finishSettle(payment: any) {
    this.isSubmittingSettle = false;
    this.closeSettleUp();
    window.dispatchEvent(new CustomEvent('paymentRecorded', { detail: payment }));
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
