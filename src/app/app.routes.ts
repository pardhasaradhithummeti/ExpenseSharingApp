import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ManageGroupsComponent } from './manage-groups/manage-groups.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { PaymentsComponent } from './payments/payments.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // User Routes
  { path: 'user', component: UserHomeComponent, canActivate: [authGuard] },
  { path: 'user-home', component: UserHomeComponent, canActivate: [authGuard] },
  { path: 'groups', component: GroupsComponent, canActivate: [authGuard] },
  { path: 'groups/:id', component: GroupDetailComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Admin Routes
  { path: 'admin', component: AdminHomeComponent, canActivate: [authGuard] },
  { path: 'manage-users', component: ManageUsersComponent, canActivate: [authGuard] },
  { path: 'manage-groups', component: ManageGroupsComponent, canActivate: [authGuard] },
  { path: 'admin/users', redirectTo: '/manage-users', pathMatch: 'full' },
  { path: 'admin/groups', redirectTo: '/manage-groups', pathMatch: 'full' },

  // Fallback
  { path: '**', redirectTo: '/login' }
];
