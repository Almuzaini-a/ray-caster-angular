import { TestBed } from '@angular/core/testing';

import { WallColorService } from './wall-color.service';

describe('WallColorService', () => {
  let service: WallColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WallColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
