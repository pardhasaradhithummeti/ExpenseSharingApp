export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  token?: string;
  groups?: string[];
  createdAt?: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  memberCount?: number;
  expenses?: Expense[];
}

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  paidById: number;
  groupId: number;
  createdAt?: string;
  paidByName?: string;
  groupName?: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  paidById: number;
  groupId: number;
}

export interface Payment {
  id?: number;
  amount: number;
  fromUserId: number;
  toUserId: number;
  groupId: number;
  createdAt?: string;
  isCompleted?: boolean;
  fromUsername?: string;
  toUsername?: string;
  groupName?: string;
}

export interface CreatePaymentDto {
  amount: number;
  fromUserId: number;
  toUserId: number;
  groupId: number;
}

export interface Settlement {
  fromUserId: number;
  toUserId: number;
  amount: number;
  fromUsername?: string;
  toUsername?: string;
}

export interface GroupBalancesResponse {
  balances: { [userId: string]: number };
  settlements: Settlement[];
}
