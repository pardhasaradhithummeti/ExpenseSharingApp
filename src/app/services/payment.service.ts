import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Payment, CreatePaymentDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://localhost:44352/api/Payment';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken() || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // 🔹 Record new settlement payment
  createPayment(dto: CreatePaymentDto): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, dto, this.getHeaders());
  }

  // 🔹 Mark payment as completed
  completePayment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/complete`, {}, this.getHeaders());
  }

  // 🔹 Get payments in a group
  getPaymentsByGroupId(groupId: number, isCompleted?: boolean): Observable<Payment[]> {
    let params = new HttpParams();
    if (isCompleted !== undefined) {
      params = params.set('isCompleted', isCompleted.toString());
    }
    const headers = this.getHeaders().headers;
    return this.http.get<Payment[]>(`${this.apiUrl}/group/${groupId}`, { headers, params });
  }
}
