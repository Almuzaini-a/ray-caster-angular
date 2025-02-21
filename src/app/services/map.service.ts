import { Injectable } from '@angular/core';
import { Vector } from '../interfaces/vector.interface';
import { Player } from '../interfaces/player.interface';
import { RenderingSurface } from '../interfaces/rendering-surface.interface';
import { WorldMapService } from './world-map.service';

// Map-related constants moved to the service
const PLAYER_RADIUS = 4;
const PLAYER_COLOR = '#008000';
const CELL_COLOR = 'rgba(200, 200, 200, 0.3)';
const GRID_COLOR = '#000000';
const COORDINATE_FONT = 'bold 8px Arial';
const RAY_COLOR = '#00ff41';
const RAY_STEP_SIZE = 0.01;

// Precompute ray positions for better performance
const RAY_POSITIONS = Array.from(
  { length: Math.floor( 2 / RAY_STEP_SIZE ) + 1 },
  ( _, i ) => parseFloat( ( -1 + i * RAY_STEP_SIZE ).toFixed( 2 ) )
);

@Injectable( {
  providedIn: 'root'
} )
export class MapService
{

  constructor ( private worldMapService: WorldMapService ) { }

  get worldMap ()
  {
    return this.worldMapService.getMap();
  }

  /**
   * Render the 2D map with player position and raycasting visualization
   */
  renderMap ( mapSurface: RenderingSurface, player: Player ): void
  {
    // Early return if no context
    if ( !mapSurface.context ) return;

    const ctx = mapSurface.context;
    const { width, height } = mapSurface;

    // Calculate cell dimensions
    const cellSizeX = width / this.worldMap[ 0 ].length;
    const cellSizeY = height / this.worldMap.length;

    // Clear previous render
    ctx.clearRect( 0, 0, width, height );

    // Draw map cells and coordinates
    this.drawMapCells( ctx, cellSizeX, cellSizeY );

    // Draw grid lines
    this.drawGridLines( ctx, cellSizeX, cellSizeY );

    // Draw player and rays
    this.drawPlayerAndRays( ctx, player, cellSizeX, cellSizeY );
  }

  /**
   * Draw the map cells with their coordinates
   */
  private drawMapCells ( ctx: CanvasRenderingContext2D, cellSizeX: number, cellSizeY: number ): void
  {
    this.worldMap.forEach( ( row, y ) =>
    {
      row.forEach( ( cell, x ) =>
      {
        // Skip empty cells
        if ( cell === 0 ) return;

        const posX = x * cellSizeX;
        const posY = y * cellSizeY;

        // Draw cell background
        ctx.fillStyle = CELL_COLOR;
        ctx.fillRect( posX, posY, cellSizeX - 1, cellSizeY - 1 );

        // Draw cell coordinates
        ctx.fillStyle = GRID_COLOR;
        ctx.font = COORDINATE_FONT;
        ctx.fillText( `${ x },${ y }`, posX + 0.5, posY + 13 );
      } );
    } );
  }

  /**
   * Draw the grid lines
   */
  private drawGridLines ( ctx: CanvasRenderingContext2D, cellSizeX: number, cellSizeY: number ): void
  {
    const mapWidth = this.worldMap[ 0 ].length;
    const mapHeight = this.worldMap.length;

    ctx.strokeStyle = GRID_COLOR;

    // Draw vertical grid lines
    for ( let x = 0; x <= mapWidth; x++ )
    {
      ctx.beginPath();
      ctx.moveTo( x * cellSizeX, 0 );
      ctx.lineTo( x * cellSizeX, mapHeight * cellSizeY );
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for ( let y = 0; y <= mapHeight; y++ )
    {
      ctx.beginPath();
      ctx.moveTo( 0, y * cellSizeY );
      ctx.lineTo( mapWidth * cellSizeX, y * cellSizeY );
      ctx.stroke();
    }
  }

  /**
   * Draw the player and raycasting visualization
   */
  private drawPlayerAndRays (
    ctx: CanvasRenderingContext2D,
    player: Player,
    cellSizeX: number,
    cellSizeY: number
  ): void
  {
    // Calculate player position in canvas coordinates
    const playerX = player.position.x * cellSizeX;
    const playerY = player.position.y * cellSizeY;

    // Draw player
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc( playerX, playerY, PLAYER_RADIUS, 0, Math.PI * 2 );
    ctx.fill();

    // Draw rays
    ctx.beginPath();
    ctx.strokeStyle = RAY_COLOR;

    // Helper function to calculate ray direction based on camera position
    const calculateRayDirection = ( cameraX: number ): Vector => ( {
      x: player.direction.x + player.plane.x * cameraX,
      y: player.direction.y + player.plane.y * cameraX
    } );

    // Helper function to draw a single ray
    const drawRay = ( rayDir: Vector ) =>
    {
      const rayCollision = this.calculateRayCollision(
        player.position,
        rayDir,
        cellSizeX,
        cellSizeY
      );

      if ( rayCollision.collision )
      {
        ctx.lineTo( rayCollision.collision.x, rayCollision.collision.y );
      }
    };

    // Draw all rays
    RAY_POSITIONS.forEach( cameraX =>
    {
      ctx.moveTo( playerX, playerY );
      const rayDir = calculateRayDirection( cameraX );
      drawRay( rayDir );
    } );

    ctx.stroke();
  }

  /**
   * Calculate ray collision using Digital Differential Analysis (DDA) algorithm
   */
  private calculateRayCollision (
    playerPos: Vector,
    rayDir: Vector,
    cellSizeX: number,
    cellSizeY: number
  ): { collision: Vector | null; distance: number; }
  {
    // Initial map position (integer coordinates)
    const mapPos: Vector = {
      x: Math.floor( playerPos.x ),
      y: Math.floor( playerPos.y )
    };

    // Calculate delta distance (distance to next x or y side)
    const deltaDistance: Vector = {
      x: Math.abs( 1 / rayDir.x ),
      y: Math.abs( 1 / rayDir.y )
    };

    // Determine step direction
    const step: Vector = {
      x: rayDir.x < 0 ? -1 : 1,
      y: rayDir.y < 0 ? -1 : 1
    };

    // Calculate initial side distances
    const sideDistance = {
      x: rayDir.x < 0
        ? ( playerPos.x - mapPos.x ) * deltaDistance.x
        : ( mapPos.x + 1.0 - playerPos.x ) * deltaDistance.x,
      y: rayDir.y < 0
        ? ( playerPos.y - mapPos.y ) * deltaDistance.y
        : ( mapPos.y + 1.0 - playerPos.y ) * deltaDistance.y
    };

    // DDA algorithm variables
    let hit = false;
    let side = 0;
    const currentPos = { ...mapPos };

    // Digital Differential Analysis (DDA) algorithm
    while ( !hit )
    {
      // Jump to next map square in x or y direction
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

      // Check if ray has hit a wall
      if ( this.worldMap[ currentPos.y ]?.[ currentPos.x ] > 0 )
      {
        hit = true;
      }
    }

    // Calculate perpendicular wall distance to avoid fisheye effect
    const perpWallDist = side === 0
      ? ( currentPos.x - playerPos.x + ( 1 - step.x ) / 2 ) / rayDir.x
      : ( currentPos.y - playerPos.y + ( 1 - step.y ) / 2 ) / rayDir.y;

    // Calculate collision point in canvas coordinates
    const collision = {
      x: playerPos.x * cellSizeX + rayDir.x * perpWallDist * cellSizeX,
      y: playerPos.y * cellSizeY + rayDir.y * perpWallDist * cellSizeY
    };

    return { collision, distance: perpWallDist };
  }

}