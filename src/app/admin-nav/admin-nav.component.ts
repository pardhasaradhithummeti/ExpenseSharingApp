import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-nav',
  imports: [],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css'
})
export class AdminNavComponent {
  
  constructor(private authService: AuthService, private router : Router){ 
  }
  onlogout() {
    this.authService.logout();
  }
  toHome(){
    this.router.navigate(["/admin"]);
  }
}

