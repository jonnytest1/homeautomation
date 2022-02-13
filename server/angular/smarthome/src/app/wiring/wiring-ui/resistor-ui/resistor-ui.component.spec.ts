/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ResistorUiComponent } from './resistor-ui.component';

describe('ResistorUiComponent', () => {
  let component: ResistorUiComponent;
  let fixture: ComponentFixture<ResistorUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResistorUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResistorUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
