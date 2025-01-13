import { Injectable } from '@angular/core';
import { WallColorService } from './wall-color.service';
import { RenderingSurface } from '../interfaces/rendering-surface.interface';
import { Player } from '../interfaces/player.interface';
import { WallColor } from '../interfaces/wall-color.interface';
import { Vector } from '../interfaces/vector.interface';
import { WORLD_MAP } from '../constants/world-map.constant';

@Injectable( {
  providedIn: 'root'
} )
export class RenderService
{
  constructor ( private wallColorService: WallColorService ) { }

  castRays ( renderingSurface: RenderingSurface, player: Player ): void
  {
    if ( !renderingSurface.context ) return;

    const buffer: ImageData = renderingSurface.context.createImageData(
      renderingSurface.width,
      renderingSurface.height
    );

    for ( let column: number = 0; column < renderingSurface.width; ++column )
    {
      const cameraX: number = 2 * column / renderingSurface.width - 1;
      const rayDirection: Vector = {
        x: player.direction.x + player.plane.x * cameraX,
        y: player.direction.y + player.plane.y * cameraX
      };

      let mapPosition: Vector = {
        x: Math.floor( player.position.x ),
        y: Math.floor( player.position.y )
      };

      const deltaDistance: Vector = {
        x: Math.abs( 1 / rayDirection.x ),
        y: Math.abs( 1 / rayDirection.y )
      };
      let perpendicularWallDistance;

      const step: Vector = {
        x: rayDirection.x < 0 ? -1 : 1,
        y: rayDirection.y < 0 ? -1 : 1
      };

      const sideDistance = {
        x: rayDirection.x < 0
          ? ( player.position.x - mapPosition.x ) * deltaDistance.x
          : ( mapPosition.x + 1.0 - player.position.x ) * deltaDistance.x,
        y: rayDirection.y < 0
          ? ( player.position.y - mapPosition.y ) * deltaDistance.y
          : ( mapPosition.y + 1.0 - player.position.y ) * deltaDistance.y
      };

      let hit: boolean = false;
      let side!: number;


      while ( !hit )
      {
        if ( sideDistance.x < sideDistance.y )
        {
          sideDistance.x += deltaDistance.x;
          mapPosition.x += step.x;
          side = 0;
        }
        else
        {
          sideDistance.y += deltaDistance.y;
          mapPosition.y += step.y;
          side = 1;
        }

        if ( WORLD_MAP[ mapPosition.y ][ mapPosition.x ] > 0 ) hit = true;
      }

      perpendicularWallDistance = side === 0
        ? ( mapPosition.x - player.position.x + ( 1 - step.x ) / 2 ) / rayDirection.x
        : ( mapPosition.y - player.position.y + ( 1 - step.y ) / 2 ) / rayDirection.y;

      const lineHeight: number = Math.floor( renderingSurface.height / perpendicularWallDistance );

      const drawStart: number = Math.max( 0, Math.floor( -lineHeight / 2 + renderingSurface.height / 2 ) );
      const drawEnd: number = Math.min(
        renderingSurface.height - 1,
        Math.floor( lineHeight / 2 + renderingSurface.height / 2 )
      );

      const wallType: number = WORLD_MAP[ mapPosition.x ][ mapPosition.y ];
      const color: WallColor = this.wallColorService.getWallColor( wallType, side );

      this.drawVerticalLine( buffer, column, drawStart, drawEnd, color, renderingSurface );
    }

    renderingSurface.context.putImageData( buffer, 0, 0 );
  }

  drawVerticalLine ( buffer: ImageData, x: number, drawStart: number, drawEnd: number,
    color: WallColor, renderingSurface: RenderingSurface ): void
  {
    const bytesPerPixel = renderingSurface.bytesPerPixel;

    // ceiling
    for ( let y = 0; y < drawStart; y++ )
    {
      const index = ( y * renderingSurface.width + x ) * bytesPerPixel;
      buffer.data[ index ] = 135;     // R
      buffer.data[ index + 1 ] = 206; // G
      buffer.data[ index + 2 ] = 235; // B
      buffer.data[ index + 3 ] = 255; // A
    }

    // wall
    for ( let y = drawStart; y <= drawEnd; y++ )
    {
      const index = ( y * renderingSurface.width + x ) * bytesPerPixel;
      buffer.data[ index ] = color.r;
      buffer.data[ index + 1 ] = color.g;
      buffer.data[ index + 2 ] = color.b;
      buffer.data[ index + 3 ] = 255;
    }

    // floor
    for ( let y = drawEnd + 1; y < renderingSurface.height; y++ )
    {
      const index = ( y * renderingSurface.width + x ) * bytesPerPixel;
      buffer.data[ index ] = 128;     // R
      buffer.data[ index + 1 ] = 128; // G
      buffer.data[ index + 2 ] = 128; // B
      buffer.data[ index + 3 ] = 255; // A
    }
  }

}
