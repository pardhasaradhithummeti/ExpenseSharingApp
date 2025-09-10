import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailPageComponent } from './group-detail-page.component';

describe('GroupDetailPageComponent', () => {
  let component: GroupDetailPageComponent;
  let fixture: ComponentFixture<GroupDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDetailPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
