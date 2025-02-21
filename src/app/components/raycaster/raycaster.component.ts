import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { RenderingSurface } from '../../interfaces/rendering-surface.interface';
import { Player } from '../../interfaces/player.interface';
import { RenderService } from '../../services/render.service';
import { PlayerService } from '../../services/player.service';
import { MapService } from '../../services/map.service';
import { WorldGeneratorService } from '../../services/world-generator.service';
import { WorldMapService } from '../../services/world-map.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component( {
  selector: 'app-raycaster',
  imports: [],
  templateUrl: './raycaster.component.html',
  styleUrl: './raycaster.component.scss',
  host: {
    '(document:keydown)': 'handleKeyDown($event)',
    '(document:keyup)': 'handleKeyUp($event)'
  },
  animations: [
    trigger( 'fadeIn', [
      transition( ':enter', [
        style( { opacity: 0, transform: 'translateY(20px)' } ),
        animate( '0.3s ease-out', style( { opacity: 1, transform: 'translateY(0)' } ) )
      ] )
    ] ),
    trigger( 'pulse', [
      transition( '* => *', [
        animate( '1s ease-in-out', style( { transform: 'scale(1.05)' } ) ),
        animate( '1s ease-in-out', style( { transform: 'scale(1)' } ) )
      ] )
    ] )
  ]
} )
export class RaycasterComponent
{
  @ViewChild( 'renderingCanvas' ) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild( 'mapCanvas' ) mapCanvasElement!: ElementRef<HTMLCanvasElement>;

  renderingSurface!: RenderingSurface;
  mapSurface!: RenderingSurface;
  private keyElements: { [ key: string ]: HTMLElement | null; } = {};

  player: Player = {
    position: { x: 22, y: 22 },
    direction: { x: -1, y: 0 },
    plane: { x: 0, y: 0.90 },
  };

  oldTime: number = 0.0;
  frameCount: number = 0.0;
  fps: number = 0.0;
  displayFps: number = 0;

  constructor (
    private renderService: RenderService,
    private playerService: PlayerService,
    private mapService: MapService,
    private worldGeneratorService: WorldGeneratorService,
    private worldMapService: WorldMapService,
    private renderer: Renderer2
  ) { }

  ngAfterViewInit (): void
  {
    const canvas: HTMLCanvasElement = this.canvasElement.nativeElement;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext( '2d' );

    if ( ctx )
    {
      this.renderingSurface = {
        width: 640,
        height: 480,
        canvas,
        context: ctx,
        bytesPerPixel: 4
      };

      this.renderingSurface.canvas.width = this.renderingSurface.width;
      this.renderingSurface.canvas.height = this.renderingSurface.height;
    }

    const mapCanvas: HTMLCanvasElement = this.mapCanvasElement.nativeElement;
    const mapCtx: CanvasRenderingContext2D | null = mapCanvas.getContext( '2d' );

    if ( mapCtx )
    {
      this.mapSurface = {
        width: 640,
        height: 480,
        canvas: mapCanvas,
        context: mapCtx,
        bytesPerPixel: 4
      };

      this.mapSurface.canvas.width = this.mapSurface.width;
      this.mapSurface.canvas.height = this.mapSurface.height;
    }

    this.oldTime = performance.now();
    setTimeout( () => this.initializeKeyElements(), 0 );
    this.startRenderLoop();
  }

  generateNewWorld ( algorithm: 'recursive' | 'dfs' | 'cellular' | 'rooms' ): void
  {
    const worldWidth = 24;
    const worldHeight = 24;

    const newWorld = this.worldGeneratorService.generateWorld( worldWidth, worldHeight, algorithm );

    this.worldMapService.setMap( newWorld );

    const playerPos = this.worldGeneratorService.ensureValidPlayerSpawn( newWorld );

    this.player.position.x = playerPos.x;
    this.player.position.y = playerPos.y;
  }

  resetToDefaultMap (): void
  {
    this.worldMapService.resetToDefault();

    this.player.position.x = 22;
    this.player.position.y = 22;
  }

  handleKeyDown ( event: KeyboardEvent ): void
  {
    this.playerService.handleKeyDown( event );
    const element: HTMLElement | null = this.keyElements[ event.key ];
    if ( element )
    {
      this.renderer.addClass( element, 'pressed' );
    }
  }

  handleKeyUp ( event: KeyboardEvent ): void
  {
    this.playerService.handleKeyUp( event );
    const element: HTMLElement | null = this.keyElements[ event.key ];
    if ( element )
    {
      this.renderer.removeClass( element, 'pressed' );
    }
  }

  private startRenderLoop (): void
  {
    const currentTime: number = performance.now();
    const frameTime: number = ( currentTime - this.oldTime ) / 1000.0;
    this.oldTime = currentTime;

    this.playerService.handleMovement( this.player, frameTime );
    this.playerService.handleFieldOfView( this.player );

    this.renderService.castRays( this.renderingSurface, this.player );
    this.mapService.renderMap( this.mapSurface, this.player );

    if ( ++this.frameCount === 10 )
    {
      this.frameCount = 0;
      this.fps = 1.0 / frameTime;
      this.displayFps = Math.round( this.fps );
    }

    requestAnimationFrame( () => this.startRenderLoop() );
  }

  private initializeKeyElements (): void
  {
    const keyMapping = {
      'w': 'W',
      'a': 'A',
      's': 'S',
      'd': 'D',
      'q': 'Q',
      'e': 'E',
      'ArrowUp': '↑',
      'ArrowLeft': '←',
      'ArrowDown': '↓',
      'ArrowRight': '→'
    };

    Object.entries( keyMapping ).forEach( ( [ key, display ] ): void =>
    {
      const elements: HTMLElement[] = Array.from( document.getElementsByTagName( 'kbd' ) );
      const element: HTMLElement | undefined = elements.find( el => el.textContent?.trim() === display );
      if ( element )
      {
        this.keyElements[ key ] = element;
      }
    } );
  }

}