/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WireUiComponent } from './wire-ui.component';

describe('WireUiComponent', () => {
  let component: WireUiComponent;
  let fixture: ComponentFixture<WireUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WireUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WireUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
