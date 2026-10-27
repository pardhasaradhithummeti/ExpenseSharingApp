import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Expense, CreateExpenseDto, GroupBalancesResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'https://localhost:44352/api/Expense';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken() || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // 🔹 Create new expense in a group
  createExpense(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, dto, this.getHeaders());
  }

  // 🔹 Get all expenses for a specific group
  getExpensesByGroupId(groupId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/group/${groupId}`, this.getHeaders());
  }

  // 🔹 Get group balances & recommended settlements
  getBalancesByGroupId(groupId: number): Observable<GroupBalancesResponse> {
    return this.http.get<GroupBalancesResponse>(`${this.apiUrl}/group/${groupId}/balances`, this.getHeaders());
  }
}
