/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { InOutComponent } from './in-out.component';

describe('InOutComponent', () => {
  let component: InOutComponent;
  let fixture: ComponentFixture<InOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InOutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
