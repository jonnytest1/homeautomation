/* tslint:disable:no-unused-variable */
import type { ComponentFixture } from '@angular/core/testing';
import { async, TestBed } from '@angular/core/testing';

import { MobileSenderComponent } from './mobile-sender.component';

describe('MobileSenderComponent', () => {
  let component: MobileSenderComponent;
  let fixture: ComponentFixture<MobileSenderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MobileSenderComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileSenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
