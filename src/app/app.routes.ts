import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ManageGroupsComponent } from './manage-groups/manage-groups.component';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'user', component: UserHomeComponent },
    { path: 'admin', component: AdminHomeComponent },
    { path: 'manage-users', component: ManageUsersComponent },
    { path: 'manage-groups', component: ManageGroupsComponent },
    { path: 'user-home', component: UserHomeComponent }
];
