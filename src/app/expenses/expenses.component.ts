import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ExpenseService } from '../services/expense.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { Group, GroupMember, Expense } from '../models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EnrichedExpenseItem extends Expense {
  groupName: string;
  payerName: string;
  isPayer: boolean;
  userShare: number;
  icon: string;
  memberCount: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  @ViewChild(AppShellComponent) appShell?: AppShellComponent;

  expenses: EnrichedExpenseItem[] = [];
  filteredExpenses: EnrichedExpenseItem[] = [];
  userGroups: Group[] = [];
  selectedFilterGroupId: number | 'all' = 'all';
  searchQuery = '';
  isLoading = true;

  totalSpent = 0;
  totalYouLent = 0;
  totalYourShare = 0;

  constructor(
    private groupService: GroupService,
    private expenseService: ExpenseService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadExpenses();
    window.addEventListener('expenseAdded', () => this.loadExpenses());
  }

  loadExpenses() {
    this.isLoading = true;
    const currentUser = this.authService.getUser();
    const currentUserId = currentUser?.id;

    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.userGroups = groups;
        if (!groups || groups.length === 0) {
          this.expenses = [];
          this.filteredExpenses = [];
          this.isLoading = false;
          return;
        }

        const requests = groups.map(g => {
          return forkJoin({
            group: of(g),
            members: this.groupService.getGroupMembers(g.id).pipe(catchError(() => of([] as GroupMember[]))),
            expenses: this.expenseService.getExpensesByGroupId(g.id).pipe(catchError(() => of([] as Expense[])))
          });
        });

        forkJoin(requests).subscribe({
          next: (results) => {
            const allItems: EnrichedExpenseItem[] = [];
            let totalSpentSum = 0;
            let youLentSum = 0;
            let yourShareSum = 0;

            results.forEach(res => {
              const g = res.group;
              const members = res.members || [];
              const groupExpenses = res.expenses || [];
              const memberCount = Math.max(members.length, 1);

              groupExpenses.forEach(exp => {
                const isPayer = (exp.paidById === currentUserId);
                const payer = members.find(m => m.id === exp.paidById);
                const payerName = isPayer ? 'You' : (payer?.username || `User #${exp.paidById}`);
                const share = Number((exp.amount / memberCount).toFixed(2));
                const amt = Number(exp.amount);

                totalSpentSum += amt;
                if (isPayer) {
                  youLentSum += (amt - share);
                } else {
                  yourShareSum += share;
                }

                allItems.push({
                  ...exp,
                  amount: amt,
                  groupName: g.name,
                  payerName: payerName,
                  isPayer: isPayer,
                  userShare: share,
                  memberCount: memberCount,
                  icon: this.getCategoryIcon(exp.description)
                });
              });
            });

            // Sort newest first
            allItems.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

            this.expenses = allItems;
            this.totalSpent = totalSpentSum;
            this.totalYouLent = youLentSum;
            this.totalYourShare = yourShareSum;

            this.applyFilter();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading group expenses', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error fetching groups for expenses', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    let result = [...this.expenses];

    if (this.selectedFilterGroupId !== 'all') {
      result = result.filter(e => e.groupId === this.selectedFilterGroupId);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.groupName.toLowerCase().includes(q) ||
        e.payerName.toLowerCase().includes(q)
      );
    }

    this.filteredExpenses = result;
  }

  openAddExpense() {
    this.appShell?.openAddExpense();
  }

  getCategoryIcon(desc?: string): string {
    if (!desc) return '💸';
    const d = desc.toLowerCase();
    if (d.includes('food') || d.includes('dinner') || d.includes('lunch') || d.includes('snack') || d.includes('snaks') || d.includes('breakfast')) return '🍕';
    if (d.includes('hotel') || d.includes('stay') || d.includes('room') || d.includes('apartment')) return '🏨';
    if (d.includes('taxi') || d.includes('cab') || d.includes('flight') || d.includes('train')) return '🚕';
    if (d.includes('movie') || d.includes('ticket') || d.includes('show')) return '🎬';
    if (d.includes('grocery') || d.includes('shopping') || d.includes('market')) return '🛒';
    return '💳';
  }
}
