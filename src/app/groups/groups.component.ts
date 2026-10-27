import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GroupService } from '../services/group.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { ExpenseService } from '../services/expense.service';
import { ToastService } from '../services/toast.service';
import { AppShellComponent } from '../shared/app-shell/app-shell.component';
import { Group, GroupMember } from '../models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EnrichedGroupItem extends Group {
  totalSpend: number;
  memberCount: number;
  members: GroupMember[];
  userBalance: number;
  lastActivityText?: string;
  icon: string;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppShellComponent],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  @ViewChild(AppShellComponent) appShell?: AppShellComponent;

  groups: EnrichedGroupItem[] = [];
  filteredGroups: EnrichedGroupItem[] = [];
  searchQuery = '';
  isLoading = true;

  // Create Group Modal
  showCreateGroupModal = false;
  newGroupName = '';
  newGroupDescription = '';
  isCreating = false;

  // Add Member Modal
  showAddMemberModal = false;
  selectedGroupForMember: EnrichedGroupItem | null = null;
  newMemberEmail = '';
  isAddingMember = false;

  constructor(
    private groupService: GroupService,
    private userService: UsersService,
    public authService: AuthService,
    private expenseService: ExpenseService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.isLoading = true;
    const currentUser = this.authService.getUser();

    // Fetch all groups
    this.groupService.getAllGroups().subscribe({
      next: (allGroups) => {
        if (!allGroups || allGroups.length === 0) {
          this.groups = [];
          this.filteredGroups = [];
          this.isLoading = false;
          return;
        }

        const requests = allGroups.map((g) => {
          return forkJoin({
            group: of(g),
            members: this.groupService.getGroupMembers(g.id).pipe(catchError(() => of([] as GroupMember[]))),
            expenses: this.expenseService.getExpensesByGroupId(g.id).pipe(catchError(() => of([]))),
            balances: this.expenseService.getBalancesByGroupId(g.id).pipe(catchError(() => of(null)))
          });
        });

        forkJoin(requests).subscribe({
          next: (results) => {
            const currentUserId = currentUser?.id;
            this.groups = results.map((r) => {
              const expenses = r.expenses || [];
              const members = r.members || [];
              const balances = r.balances;
              const totalSpend = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

              let userBal = 0;
              if (currentUserId && balances && balances.balances && balances.balances[currentUserId.toString()] !== undefined) {
                userBal = Number(balances.balances[currentUserId.toString()]);
              }

              return {
                ...r.group,
                totalSpend: totalSpend,
                members: members,
                memberCount: members.length || 1,
                userBalance: userBal,
                lastActivityText: expenses.length > 0 ? 'Active recently' : 'No expenses yet',
                icon: this.getGroupIcon(r.group.name)
              };
            });

            this.applyFilter();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Failed to load group details', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load groups', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groups];
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredGroups = this.groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  }

  openGroup(groupId: number) {
    this.router.navigate(['/groups', groupId]);
  }

  // --- Create Group ---
  openCreateGroup() {
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.showCreateGroupModal = true;
  }

  closeCreateGroup() {
    this.showCreateGroupModal = false;
    this.isCreating = false;
  }

  submitCreateGroup() {
    if (!this.newGroupName.trim()) {
      this.toastService.warning('Group name is required.');
      return;
    }

    this.isCreating = true;
    this.groupService.addGroup({
      name: this.newGroupName.trim(),
      description: this.newGroupDescription.trim()
    }).subscribe({
      next: (created) => {
        const u = this.authService.getUser();
        if (u?.email) {
          this.groupService.addUserToGroup(this.newGroupName.trim(), u.email).subscribe({
            next: () => {
              this.toastService.success(`Group "${this.newGroupName}" created!`);
              this.closeCreateGroup();
              this.loadGroups();
            },
            error: () => {
              this.toastService.success(`Group "${this.newGroupName}" created!`);
              this.closeCreateGroup();
              this.loadGroups();
            }
          });
        } else {
          this.toastService.success(`Group "${this.newGroupName}" created!`);
          this.closeCreateGroup();
          this.loadGroups();
        }
      },
      error: (err) => {
        console.error('Failed to create group', err);
        this.isCreating = false;
        this.toastService.error('Failed to create group.');
      }
    });
  }

  // --- Add Member Modal ---
  openAddMember(group: EnrichedGroupItem, event: Event) {
    event.stopPropagation();
    this.selectedGroupForMember = group;
    this.newMemberEmail = '';
    this.showAddMemberModal = true;
  }

  closeAddMember() {
    this.showAddMemberModal = false;
    this.selectedGroupForMember = null;
    this.isAddingMember = false;
  }

  submitAddMember() {
    if (!this.selectedGroupForMember || !this.newMemberEmail.trim()) {
      this.toastService.warning('Please enter a valid user email.');
      return;
    }

    this.isAddingMember = true;
    this.groupService.addUserToGroup(
      this.selectedGroupForMember.name,
      this.newMemberEmail.trim()
    ).subscribe({
      next: () => {
        this.toastService.success(`User ${this.newMemberEmail} added to ${this.selectedGroupForMember?.name}!`);
        this.closeAddMember();
        this.loadGroups();
      },
      error: (err) => {
        console.error('Failed to add member', err);
        this.isAddingMember = false;
        this.toastService.error('Failed to add user. Verify the email exists in system.');
      }
    });
  }

  getGroupIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('trip') || n.includes('tour') || n.includes('goa') || n.includes('paris') || n.includes('mumbai') || n.includes('singapore') || n.includes('maldevs') || n.includes('new york')) {
      return '✈️';
    }
    if (n.includes('apartment') || n.includes('flat') || n.includes('home') || n.includes('house') || n.includes('rent')) {
      return '🏠';
    }
    if (n.includes('office') || n.includes('work') || n.includes('meeting') || n.includes('team') || n.includes('project')) {
      return '💼';
    }
    if (n.includes('food') || n.includes('dinner') || n.includes('party')) {
      return '🍕';
    }
    return '👥';
  }
}
