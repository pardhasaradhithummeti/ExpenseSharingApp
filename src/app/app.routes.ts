import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ManageGroupsComponent } from './manage-groups/manage-groups.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { userGuard } from './guards/user.guard';
import { GroupDetailPageComponent } from './group-detail-page/group-detail-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'user', component: UserHomeComponent, canActivate: [authGuard, userGuard] },
  { path: 'user-home', component: UserHomeComponent, canActivate: [authGuard, userGuard] },
  { path: 'group-detail/:id', component: GroupDetailPageComponent, canActivate: [authGuard, userGuard] },
  { path: 'admin', component: AdminHomeComponent, canActivate: [authGuard, adminGuard] },
  { path: 'manage-users', component: ManageUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'manage-groups', component: ManageGroupsComponent, canActivate: [authGuard, adminGuard] },

];
