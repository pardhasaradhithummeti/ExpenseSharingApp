import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService } from '../services/group.service';
import { ExpenseService } from '../services/expense.service';
import { PaymentService } from '../services/payment.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { Group, GroupMember, Payment, Settlement } from '../models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EnrichedSettlement extends Settlement {
  groupName: string;
  groupId: number;
  isUserInvolved: boolean;
  isUserDebtor: boolean;
  isUserCreditor: boolean;
}

export interface EnrichedPaymentItem extends Payment {
  groupName: string;
  fromName: string;
  toName: string;
  isUserPayer: boolean;
  isUserReceiver: boolean;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  @ViewChild(AppShellComponent) appShell?: AppShellComponent;

  youOwe = 0;
  youAreOwed = 0;
  netBalance = 0;

  pendingSettlements: EnrichedSettlement[] = [];
  paymentHistory: EnrichedPaymentItem[] = [];
  userGroups: Group[] = [];
  isLoading = true;

  activeTab: 'pending' | 'history' = 'pending';

  constructor(
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private paymentService: PaymentService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPaymentData();
    window.addEventListener('paymentRecorded', () => this.loadPaymentData());
    window.addEventListener('expenseAdded', () => this.loadPaymentData());
  }

  loadPaymentData() {
    this.isLoading = true;
    const currentUser = this.authService.getUser();
    const currentUserId = currentUser?.id;

    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.userGroups = groups;
        if (!groups || groups.length === 0) {
          this.pendingSettlements = [];
          this.paymentHistory = [];
          this.isLoading = false;
          return;
        }

        const requests = groups.map(g => {
          return forkJoin({
            group: of(g),
            members: this.groupService.getGroupMembers(g.id).pipe(catchError(() => of([] as GroupMember[]))),
            balances: this.expenseService.getBalancesByGroupId(g.id).pipe(catchError(() => of(null))),
            payments: this.paymentService.getPaymentsByGroupId(g.id).pipe(catchError(() => of([] as Payment[])))
          });
        });

        forkJoin(requests).subscribe({
          next: (results) => {
            let totalOwe = 0;
            let totalReceive = 0;
            const allSettlements: EnrichedSettlement[] = [];
            const allPayments: EnrichedPaymentItem[] = [];

            results.forEach(res => {
              const g = res.group;
              const members = res.members || [];
              const balances = res.balances;
              const payments = res.payments || [];

              // Balance for current user
              if (currentUserId && balances && balances.balances) {
                const bal = Number(balances.balances[currentUserId.toString()] || 0);
                if (bal > 0) totalReceive += bal;
                else if (bal < 0) totalOwe += Math.abs(bal);
              }

              // Settlements
              if (balances && balances.settlements) {
                balances.settlements.forEach(s => {
                  const fromM = members.find(m => m.id === s.fromUserId);
                  const toM = members.find(m => m.id === s.toUserId);
                  const isDebtor = (s.fromUserId === currentUserId);
                  const isCreditor = (s.toUserId === currentUserId);

                  allSettlements.push({
                    ...s,
                    groupName: g.name,
                    groupId: g.id,
                    fromUsername: fromM ? fromM.username : `User #${s.fromUserId}`,
                    toUsername: toM ? toM.username : `User #${s.toUserId}`,
                    isUserInvolved: (isDebtor || isCreditor),
                    isUserDebtor: isDebtor,
                    isUserCreditor: isCreditor
                  });
                });
              }

              // Payments
              payments.forEach(p => {
                const fromM = members.find(m => m.id === p.fromUserId);
                const toM = members.find(m => m.id === p.toUserId);
                allPayments.push({
                  ...p,
                  groupName: g.name,
                  fromName: fromM ? fromM.username : `User #${p.fromUserId}`,
                  toName: toM ? toM.username : `User #${p.toUserId}`,
                  isUserPayer: (p.fromUserId === currentUserId),
                  isUserReceiver: (p.toUserId === currentUserId)
                });
              });
            });

            // Sort payments by date descending
            allPayments.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

            // Prioritize settlements where current user is involved
            allSettlements.sort((a, b) => (b.isUserInvolved ? 1 : 0) - (a.isUserInvolved ? 1 : 0));

            this.youOwe = Number(totalOwe.toFixed(2));
            this.youAreOwed = Number(totalReceive.toFixed(2));
            this.netBalance = Number((this.youAreOwed - this.youOwe).toFixed(2));
            this.pendingSettlements = allSettlements;
            this.paymentHistory = allPayments;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching payments and settlements', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading groups for settlements', err);
        this.isLoading = false;
      }
    });
  }

  openRecordPayment(settlement?: EnrichedSettlement) {
    if (settlement) {
      this.appShell?.openSettleUp(settlement.groupId, settlement.fromUserId, settlement.toUserId, settlement.amount);
    } else {
      this.appShell?.openSettleUp();
    }
  }
}
