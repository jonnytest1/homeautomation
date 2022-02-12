/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RegexHighlightedComponent } from './regex-highlighted.component';

describe('RegexHighlightedComponent', () => {
  let component: RegexHighlightedComponent;
  let fixture: ComponentFixture<RegexHighlightedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegexHighlightedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegexHighlightedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
