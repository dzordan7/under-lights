import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchResultModal } from './match-result-modal';

describe('MatchResultModal', () => {
  let component: MatchResultModal;
  let fixture: ComponentFixture<MatchResultModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchResultModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchResultModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
