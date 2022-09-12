/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MobileTimersComponent } from './timers.component';

describe('TimersComponent', () => {
  let component: MobileTimersComponent;
  let fixture: ComponentFixture<MobileTimersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MobileTimersComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileTimersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
