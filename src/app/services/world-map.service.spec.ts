import { TestBed } from '@angular/core/testing';

import { WorldMapService } from './world-map.service';

describe('WorldMapService', () => {
  let service: WorldMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorldMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
