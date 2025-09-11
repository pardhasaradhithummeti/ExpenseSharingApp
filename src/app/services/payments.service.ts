import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private apiUrl = 'https://localhost:44352/api/Payment';
    private token = '';
  constructor(private http: HttpClient , private authService:AuthService) {
    this.token = this.authService.getToken() || '';
  }
  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`
    };
  }
  // Add payment
  addPayment(payment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payment,{ headers: this.headers });
  }

  // Complete payment
  completePayment(paymentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${paymentId}/complete`, { headers: this.headers });
  }

  // Get payments for a group
  getPaymentsByGroup(groupId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/group/${groupId}`,{ headers: this.headers });
  }
}
