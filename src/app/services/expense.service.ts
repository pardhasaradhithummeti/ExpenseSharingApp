import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private url = "https://localhost:44352/api/Expense";

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ✅ Get headers with token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Get all expenses of a group
  getExpensesByGroup(groupId: number): Observable<any> {
    return this.http.get(`${this.url}/group/${groupId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ Get balances & settlements of a group
  getBalances(groupId: number): Observable<any> {
    return this.http.get(`${this.url}/group/${groupId}/balances`, {
      headers: this.getHeaders()
    });
  }

  // ✅ Add a new expense
  addExpense(expense: any): Observable<any> {
    return this.http.post(this.url, expense, {
      headers: this.getHeaders()
    });
  }
}
