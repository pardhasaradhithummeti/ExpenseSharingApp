import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GroupService } from '../services/group.service';
import { PaymentsService } from '../services/payments.service';

interface Payment {
  id?: number;
  fromUserId: number;
  toUserId: number;
  amount: number;
  groupId: number;
  isCompleted?: boolean;
}

interface User {
  id: number;
  username: string;
}

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments-page.component.html',
  styleUrls: ['./payments-page.component.css']
})
export class PaymentsPageComponent implements OnInit {
  groupId!: number;
  payments: Payment[] = [];
  members: User[] = [];

  newPayment!: Payment;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentsService,
    private groupService: GroupService
  ) {}

ngOnInit(): void {
  this.groupId = Number(this.route.snapshot.paramMap.get('groupId'));

  const loggedInUserId = Number(localStorage.getItem('UserId'));

  this.newPayment = {
    fromUserId: loggedInUserId,   // ✅ always payer
    toUserId: 0,
    amount: 0,
    groupId: this.groupId
  };

  this.route.queryParams.subscribe(params => {
    if (params['toUserId']) {
      this.newPayment.toUserId = Number(params['toUserId']);
    }
  });

  this.loadPayments();
  this.loadGroupMembers();
}


  // ✅ Load payments
  loadPayments(): void {
    this.paymentService.getPaymentsByGroup(this.groupId).subscribe({
      next: (res: Payment[]) => {
        this.payments = res || [];
      },
      error: (err) => console.error('Error loading payments', err)
    });
  }

  // ✅ Load group members
  loadGroupMembers(): void {
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (res: any) => {
        if (res.members) {
          this.members = res.members as User[];
        } else if (Array.isArray(res)) {
          this.members = res as User[];
        } else {
          this.members = [];
        }
      },
      error: (err) => console.error('Error loading group members', err)
    });
  }

  // ✅ Add & auto-complete payment
  addPayment(): void {
    if (
      !this.newPayment.fromUserId ||
      !this.newPayment.toUserId ||
      this.newPayment.amount <= 0 ||
      this.newPayment.fromUserId === this.newPayment.toUserId
    ) {
      alert('⚠️ Please select different users and enter a valid amount greater than 0.');
      return;
    }

    // 🔥 Directly add payment as completed
    const paymentToSave = { ...this.newPayment, isCompleted: true };

    this.paymentService.addPayment(paymentToSave).subscribe({
      next: () => {
        alert('✅ Payment completed successfully!');
        this.loadPayments();
        this.resetNewPayment();
      },
      error: (err) => console.error('Error adding payment', err)
    });
  }

  // ✅ Get username by id
  getUserName(userId: number): string {
    const user = this.members.find((m) => m.id === userId);
    return user ? user.username : `User ${userId}`;
  }

  // ✅ Reset form
  private resetNewPayment(): void {
    this.newPayment = {
      fromUserId: 0,
      toUserId: 0,
      amount: 0,
      groupId: this.groupId,
      isCompleted: true  // always completed
    };
  }
}
