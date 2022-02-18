/* tslint:disable:no-unused-variable */
import type { ComponentFixture } from '@angular/core/testing';
import { async, TestBed } from '@angular/core/testing';

import { TransformatorUiComponent } from './transformator-ui.component';

describe('TransformatorUiComponent', () => {
  let component: TransformatorUiComponent;
  let fixture: ComponentFixture<TransformatorUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TransformatorUiComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformatorUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
