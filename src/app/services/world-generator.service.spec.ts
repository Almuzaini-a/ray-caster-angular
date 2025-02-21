import { TestBed } from '@angular/core/testing';

import { WorldGeneratorService } from './world-generator.service';

describe('WorldGeneratorService', () => {
  let service: WorldGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorldGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
