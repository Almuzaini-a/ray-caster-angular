import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { RenderingSurface } from '../../interfaces/rendering-surface.interface';
import { Player } from '../../interfaces/player.interface';
import { RenderService } from '../../services/render.service';
import { PlayerService } from '../../services/player.service';
import { WORLD_MAP } from '../../constants/world-map.constant';
import { Vector } from '../../interfaces/vector.interface';
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


  private startRenderLoop (): void
  {
    const currentTime: number = performance.now();
    const frameTime: number = ( currentTime - this.oldTime ) / 1000.0;
    this.oldTime = currentTime;

    this.playerService.handleMovement( this.player, frameTime );
    this.playerService.handleFieldOfView( this.player );

    this.renderService.castRays( this.renderingSurface, this.player );
    this.render2DMap();

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

  private render2DMap (): void
  {
    if ( !this.mapSurface.context ) return;
    const ctx: CanvasRenderingContext2D = this.mapSurface.context;

    const cellSize: number = Math.min(
      this.mapSurface.width / WORLD_MAP[ 0 ].length,
      this.mapSurface.height / WORLD_MAP.length
    );

    const offsetX: number = ( this.mapSurface.width - WORLD_MAP[ 0 ].length * cellSize ) / 2;
    const offsetY: number = ( this.mapSurface.height - WORLD_MAP.length * cellSize ) / 2;

    ctx.save();
    ctx.translate( offsetX, offsetY );

    WORLD_MAP.forEach( ( row, y ): void =>
    {
      row.forEach( ( cell, x ): void =>
      {
        const posX: number = x * cellSize;
        const posY: number = y * cellSize;

        ctx.fillStyle = cell === 0 ? '#333' : '#888';
        ctx.fillRect( posX, posY, cellSize - 1, cellSize - 1 );

        if ( cell !== 0 )
        {
          ctx.fillStyle = '#000';
          ctx.font = '8px monospace';
          ctx.fillText( `${ x },${ y }`, posX + 2, posY + 8 );
        }
      } );
    } );

    const playerX: number = this.player.position.x * cellSize;
    const playerY: number = this.player.position.y * cellSize;

    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.arc( playerX, playerY, 5, 0, Math.PI * 2 );
    ctx.fill();

    const rayCollision = this.calculateRayCollision(
      this.player.position,
      this.player.direction,
      cellSize
    );

    ctx.strokeStyle = '#00ff41';
    ctx.beginPath();
    ctx.moveTo( playerX, playerY );

    const drawRay = ( rayDir: Vector ) =>
    {
      const rayCollision = this.calculateRayCollision(
        this.player.position,
        rayDir,
        cellSize
      );

      if ( rayCollision.collision )
      {
        ctx.lineTo( rayCollision.collision.x, rayCollision.collision.y );
      }
    };

    const calculateRayDirection = ( cameraX: number ): Vector => ( {
      x: this.player.direction.x + this.player.plane.x * cameraX,
      y: this.player.direction.y + this.player.plane.y * cameraX
    } );

    ctx.strokeStyle = '#00ff41';
    ctx.beginPath();

    const stepSize = 0.01;
    const rayPositions = [];
    for ( let i = -1; i <= 1; i += stepSize )
    {
      rayPositions.push( parseFloat( i.toFixed( 2 ) ) );
    }

    rayPositions.forEach( cameraX =>
    {
      ctx.moveTo( playerX, playerY );
      const rayDir = calculateRayDirection( cameraX );
      drawRay( rayDir );
    } );

    ctx.stroke();

    ctx.strokeStyle = '#1a1a1a';
    for ( let x = 0; x <= WORLD_MAP[ 0 ].length; x++ )
    {
      ctx.beginPath();
      ctx.moveTo( x * cellSize, 0 );
      ctx.lineTo( x * cellSize, WORLD_MAP.length * cellSize );
      ctx.stroke();
    }
    for ( let y = 0; y <= WORLD_MAP.length; y++ )
    {
      ctx.beginPath();
      ctx.moveTo( 0, y * cellSize );
      ctx.lineTo( WORLD_MAP[ 0 ].length * cellSize, y * cellSize );
      ctx.stroke();
    }

    ctx.restore();

  }

  private calculateRayCollision (
    playerPos: Vector,
    rayDir: Vector,
    cellSize: number
  ): { collision: Vector | null; distance: number; }
  {
    const mapPos: Vector = {
      x: Math.floor( playerPos.x ),
      y: Math.floor( playerPos.y )
    };

    const deltaDistance: Vector = {
      x: Math.abs( 1 / rayDir.x ),
      y: Math.abs( 1 / rayDir.y )
    };

    const step: Vector = {
      x: rayDir.x < 0 ? -1 : 1,
      y: rayDir.y < 0 ? -1 : 1
    };

    const sideDistance = {
      x: rayDir.x < 0
        ? ( playerPos.x - mapPos.x ) * deltaDistance.x
        : ( mapPos.x + 1.0 - playerPos.x ) * deltaDistance.x,
      y: rayDir.y < 0
        ? ( playerPos.y - mapPos.y ) * deltaDistance.y
        : ( mapPos.y + 1.0 - playerPos.y ) * deltaDistance.y
    };

    let hit: boolean = false;
    let side: number = 0;
    const currentPos = { ...mapPos };

    while ( !hit )
    {
      if ( sideDistance.x < sideDistance.y )
      {
        sideDistance.x += deltaDistance.x;
        currentPos.x += step.x;
        side = 0;
      } else
      {
        sideDistance.y += deltaDistance.y;
        currentPos.y += step.y;
        side = 1;
      }

      if ( WORLD_MAP[ currentPos.y ]?.[ currentPos.x ] > 0 )
      {
        hit = true;
      }
    }

    const perpWallDist: number = side === 0
      ? ( currentPos.x - playerPos.x + ( 1 - step.x ) / 2 ) / rayDir.x
      : ( currentPos.y - playerPos.y + ( 1 - step.y ) / 2 ) / rayDir.y;

    const collision = {
      x: playerPos.x * cellSize + rayDir.x * perpWallDist * cellSize,
      y: playerPos.y * cellSize + rayDir.y * perpWallDist * cellSize
    };

    return { collision, distance: perpWallDist };
  }

}