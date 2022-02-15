/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ExamplePickerComponent } from './example-picker.component';

describe('ExamplePickerComponent', () => {
  let component: ExamplePickerComponent;
  let fixture: ComponentFixture<ExamplePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExamplePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExamplePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
