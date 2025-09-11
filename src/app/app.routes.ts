import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ManageGroupsComponent } from './manage-groups/manage-groups.component';

import { GroupDetailPageComponent } from './group-detail-page/group-detail-page.component';
import { PaymentsPageComponent } from './payments-page/payments-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'user', component: UserHomeComponent, },
  { path: 'user-home', component: UserHomeComponent, },
  { path: 'group-detail/:id', component: GroupDetailPageComponent, },
  { path: 'admin', component: AdminHomeComponent,  },
  { path: 'manage-users', component: ManageUsersComponent,  },
  { path: 'manage-groups', component: ManageGroupsComponent,  },
{ path: 'payments/:groupId', component: PaymentsPageComponent }

];
