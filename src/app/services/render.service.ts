import { Injectable } from '@angular/core';
import { WallColorService } from './wall-color.service';
import { RenderingSurface } from '../interfaces/rendering-surface.interface';
import { Player } from '../interfaces/player.interface';
import { WallColor } from '../interfaces/wall-color.interface';
import { Vector } from '../interfaces/vector.interface';
import { WorldMapService } from './world-map.service';

// Color constants
const CEILING_COLOR = { r: 135, g: 206, b: 235 };
const FLOOR_COLOR = { r: 128, g: 128, b: 128 };

// Raycasting parameters
interface RaycastResult
{
  distance: number;
  mapPosition: Vector;
  side: number;
}

@Injectable( {
  providedIn: 'root'
} )
export class RenderService
{
  constructor (
    private wallColorService: WallColorService,
    private worldMapService: WorldMapService
  ) { }

  get worldMap ()
  {
    return this.worldMapService.getMap();
  }

  /**
   * Main method to cast rays and render the scene
   */
  castRays ( renderingSurface: RenderingSurface, player: Player ): void
  {
    if ( !renderingSurface.context ) return;

    const { width, height } = renderingSurface;
    const buffer: ImageData = renderingSurface.context.createImageData( width, height );

    for ( let column = 0; column < width; ++column )
    {
      // Calculate ray position and direction
      const cameraX = 2 * column / width - 1;
      const rayDirection: Vector = {
        x: player.direction.x + player.plane.x * cameraX,
        y: player.direction.y + player.plane.y * cameraX
      };

      // Perform the raycast
      const rayCastResult = this.performRaycast( player.position, rayDirection );

      // Calculate wall height and vertical draw coordinates
      const lineHeight = Math.floor( height / rayCastResult.distance );
      const drawStart = Math.max( 0, Math.floor( -lineHeight / 2 + height / 2 ) );
      const drawEnd = Math.min( height - 1, Math.floor( lineHeight / 2 + height / 2 ) );

      // Get wall color based on hit position
      const wallType = this.worldMap[ rayCastResult.mapPosition.y ][ rayCastResult.mapPosition.x ];
      const color = this.wallColorService.getWallColor( wallType, rayCastResult.side );

      // Draw the vertical line for this column
      this.drawVerticalLine( buffer, column, drawStart, drawEnd, color, renderingSurface );
    }

    renderingSurface.context.putImageData( buffer, 0, 0 );
  }

  /**
   * Perform the raycast and return hit information
   */
  private performRaycast ( playerPosition: Vector, rayDirection: Vector ): RaycastResult
  {
    // Initial mapPosition (which map tile the player is in)
    const mapPosition: Vector = {
      x: Math.floor( playerPosition.x ),
      y: Math.floor( playerPosition.y )
    };

    // Calculate delta distance (distance to next x or y side)
    const deltaDistance: Vector = {
      x: Math.abs( 1 / rayDirection.x ),
      y: Math.abs( 1 / rayDirection.y )
    };

    // Determine step direction and initial side distance
    const step: Vector = {
      x: rayDirection.x < 0 ? -1 : 1,
      y: rayDirection.y < 0 ? -1 : 1
    };

    const sideDistance = {
      x: rayDirection.x < 0
        ? ( playerPosition.x - mapPosition.x ) * deltaDistance.x
        : ( mapPosition.x + 1.0 - playerPosition.x ) * deltaDistance.x,
      y: rayDirection.y < 0
        ? ( playerPosition.y - mapPosition.y ) * deltaDistance.y
        : ( mapPosition.y + 1.0 - playerPosition.y ) * deltaDistance.y
    };

    // DDA algorithm
    let hit = false;
    let side = 0;

    while ( !hit )
    {
      // Jump to next map square in x or y direction
      if ( sideDistance.x < sideDistance.y )
      {
        sideDistance.x += deltaDistance.x;
        mapPosition.x += step.x;
        side = 0;
      } else
      {
        sideDistance.y += deltaDistance.y;
        mapPosition.y += step.y;
        side = 1;
      }

      // Check if ray has hit a wall
      if ( this.worldMap[ mapPosition.y ][ mapPosition.x ] > 0 )
      {
        hit = true;
      }
    }

    // Calculate perpendicular distance to the wall to avoid fisheye effect
    const perpendicularDistance = side === 0
      ? ( mapPosition.x - playerPosition.x + ( 1 - step.x ) / 2 ) / rayDirection.x
      : ( mapPosition.y - playerPosition.y + ( 1 - step.y ) / 2 ) / rayDirection.y;

    return {
      distance: perpendicularDistance,
      mapPosition,
      side
    };
  }

  /**
   * Draw a vertical line in the buffer (ceiling, wall, floor)
   */
  drawVerticalLine (
    buffer: ImageData,
    x: number,
    drawStart: number,
    drawEnd: number,
    color: WallColor,
    renderingSurface: RenderingSurface
  ): void
  {
    const bytesPerPixel = renderingSurface.bytesPerPixel;
    const width = renderingSurface.width;
    const height = renderingSurface.height;

    // Draw ceiling (0 to drawStart)
    this.drawVerticalSection(
      buffer,
      x,
      0,
      drawStart,
      CEILING_COLOR,
      width,
      bytesPerPixel
    );

    // Draw wall (drawStart to drawEnd)
    this.drawVerticalSection(
      buffer,
      x,
      drawStart,
      drawEnd + 1,
      color,
      width,
      bytesPerPixel
    );

    // Draw floor (drawEnd to bottom)
    this.drawVerticalSection(
      buffer,
      x,
      drawEnd + 1,
      height,
      FLOOR_COLOR,
      width,
      bytesPerPixel
    );
  }

  /**
   * Draw a vertical section with a specific color
   */
  private drawVerticalSection (
    buffer: ImageData,
    x: number,
    yStart: number,
    yEnd: number,
    color: WallColor,
    width: number,
    bytesPerPixel: number
  ): void
  {
    for ( let y = yStart; y < yEnd; y++ )
    {
      const index = ( y * width + x ) * bytesPerPixel;
      buffer.data[ index ] = color.r;      // R
      buffer.data[ index + 1 ] = color.g;  // G
      buffer.data[ index + 2 ] = color.b;  // B
      buffer.data[ index + 3 ] = 255;      // A
    }
  }

}