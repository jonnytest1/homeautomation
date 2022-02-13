/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LedUiComponent } from './led-ui.component';

describe('LedUiComponent', () => {
  let component: LedUiComponent;
  let fixture: ComponentFixture<LedUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LedUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LedUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
