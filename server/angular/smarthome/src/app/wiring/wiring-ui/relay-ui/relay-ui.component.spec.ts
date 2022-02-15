/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RelayUiComponent } from './relay-ui.component';

describe('RelayUiComponent', () => {
  let component: RelayUiComponent;
  let fixture: ComponentFixture<RelayUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelayUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelayUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
