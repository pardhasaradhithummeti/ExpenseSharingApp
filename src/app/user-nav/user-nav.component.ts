import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-nav',
  imports: [],
  templateUrl: './user-nav.component.html',
  styleUrl: './user-nav.component.css'
})
export class UserNavComponent {
  constructor(private authService: AuthService , private router:Router){

  }
  username = "user";
  goDashboard(){
    this.router.navigate(["/user"])
  }
  
  logout(){
    this.authService.logout();

  }
}
