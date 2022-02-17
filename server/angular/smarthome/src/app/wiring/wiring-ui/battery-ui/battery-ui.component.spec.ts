/* tslint:disable:no-unused-variable */
import type { ComponentFixture } from '@angular/core/testing';
import { async, TestBed } from '@angular/core/testing';

import { BatteryUiComponent } from './battery-ui.component';

describe('BatteryUiComponent', () => {
  let component: BatteryUiComponent;
  let fixture: ComponentFixture<BatteryUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BatteryUiComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatteryUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
