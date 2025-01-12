import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { RenderingSurface } from '../../interfaces/rendering-surface.interface';
import { Player } from '../../interfaces/player.interface';
import { RenderService } from '../../services/render.service';
import { PlayerService } from '../../services/player.service';

@Component( {
  selector: 'app-raycaster',
  imports: [],
  templateUrl: './raycaster.component.html',
  styleUrl: './raycaster.component.scss',
  host: {
    '(document:keydown)': 'handleKeyDown($event)',
    '(document:keyup)': 'handleKeyUp($event)'
  }
} )
export class RaycasterComponent
{
  @ViewChild( 'renderingCanvas' ) canvasElement!: ElementRef<HTMLCanvasElement>;

  renderingSurface!: RenderingSurface;
  private keyElements: { [ key: string ]: HTMLElement | null; } = {};

  player: Player = {
    position: { x: 22, y: 12 },
    direction: { x: -1, y: 0 },
    plane: { x: 0, y: 0.90 },
  };

  oldTime: number = 0.0;
  frameCount: number = 0.0;
  fps: number = 0.0;

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

      this.oldTime = performance.now();

      setTimeout( () => this.initializeKeyElements(), 0 );
      this.startRenderLoop();
    }
  }

  private startRenderLoop (): void
  {
    const currentTime: number = performance.now();
    const frameTime: number = ( currentTime - this.oldTime ) / 1000.0;
    this.oldTime = currentTime;

    this.playerService.handleMovement( this.player, frameTime );
    this.renderService.castRays( this.renderingSurface, this.player );

    if ( ++this.frameCount === 10 )
    {
      this.frameCount = 0;
      this.fps = 1.0 / frameTime;
      this.renderService.updateFPS( this.renderingSurface, this.fps );
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
      'ArrowLeft': '←',
      'ArrowRight': '→'
    };

    Object.entries( keyMapping ).forEach( ( [ key, display ] ) =>
    {
      const elements = Array.from( document.getElementsByTagName( 'kbd' ) );
      const element = elements.find( el => el.textContent?.trim() === display );
      if ( element )
      {
        this.keyElements[ key ] = element;
      }
    } );
  }

  handleKeyDown ( event: KeyboardEvent ): void
  {
    this.playerService.handleKeyDown( event );
    const element = this.keyElements[ event.key ];
    if ( element )
    {
      this.renderer.addClass( element, 'pressed' );
    }
  }

  handleKeyUp ( event: KeyboardEvent ): void
  {
    this.playerService.handleKeyUp( event );
    const element = this.keyElements[ event.key ];
    if ( element )
    {
      this.renderer.removeClass( element, 'pressed' );
    }
  }

}