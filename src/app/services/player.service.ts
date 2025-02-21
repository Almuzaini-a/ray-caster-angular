import { Injectable } from '@angular/core';
import { Player } from '../interfaces/player.interface';
import { Vector } from '../interfaces/vector.interface';
import { WorldMapService } from './world-map.service';

// Constants for player movement
const MOVEMENT_SPEED_MULTIPLIER = 5.0;
const ROTATION_SPEED_MULTIPLIER = 3.0;
const FOV_CHANGE_RATE = 0.01;
const MIN_FOV = 0.30;
const MAX_FOV = 0.90;

// Input key mapping
const MOVEMENT_KEYS = {
  FORWARD: [ 'w', 'ArrowUp' ],
  BACKWARD: [ 's', 'ArrowDown' ],
  ROTATE_LEFT: [ 'a', 'ArrowLeft' ],
  ROTATE_RIGHT: [ 'd', 'ArrowRight' ],
  INCREASE_FOV: [ 'e' ],
  DECREASE_FOV: [ 'q' ]
};

@Injectable( {
  providedIn: 'root'
} )
export class PlayerService
{

  constructor ( private worldMapService: WorldMapService ) { }

  get worldMap ()
  {
    return this.worldMapService.getMap();
  }

  private keys: { [ key: string ]: boolean; } = {};

  /**
   * Handle key down events
   */
  handleKeyDown ( event: KeyboardEvent ): void
  {
    const normalizedKey = this.normalizeKey( event.key );
    this.keys[ normalizedKey ] = true;
  }

  /**
   * Handle key up events
   */
  handleKeyUp ( event: KeyboardEvent ): void
  {
    const normalizedKey = this.normalizeKey( event.key );
    this.keys[ normalizedKey ] = false;
  }

  /**
   * Normalize key input (lowercase for letters)
   */
  private normalizeKey ( key: string ): string
  {
    return /^[A-Za-z]$/.test( key ) ? key.toLowerCase() : key;
  }

  /**
   * Check if any key in the provided array is currently pressed
   */
  private isAnyKeyPressed ( keyArray: string[] ): boolean
  {
    return keyArray.some( key => this.keys[ key ] );
  }

  /**
   * Main method to handle player movement based on key input
   */
  handleMovement ( player: Player, frameTime: number ): void
  {
    const moveSpeed = frameTime * MOVEMENT_SPEED_MULTIPLIER;
    const rotSpeed = frameTime * ROTATION_SPEED_MULTIPLIER;

    // Handle forward/backward movement
    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.FORWARD ) )
    {
      this.movePlayer( player, moveSpeed );
    }

    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.BACKWARD ) )
    {
      this.movePlayer( player, -moveSpeed );
    }

    // Handle rotation
    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.ROTATE_LEFT ) )
    {
      this.rotate( player, rotSpeed );
    }

    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.ROTATE_RIGHT ) )
    {
      this.rotate( player, -rotSpeed );
    }
  }

  /**
   * Move player in the direction they're facing
   * @param player Player object
   * @param speed Movement speed (negative for backward)
   */
  private movePlayer ( player: Player, speed: number ): void
  {
    const newPosition: Vector = {
      x: player.position.x + player.direction.x * speed,
      y: player.position.y + player.direction.y * speed
    };

    // Handle collision detection - try moving on x-axis
    if ( this.isValidPosition( player.position.y, newPosition.x ) )
    {
      player.position.x = newPosition.x;
    }

    // Handle collision detection - try moving on y-axis
    if ( this.isValidPosition( newPosition.y, player.position.x ) )
    {
      player.position.y = newPosition.y;
    }
  }

  /**
   * Check if a position is valid (not colliding with walls)
   */
  private isValidPosition ( y: number, x: number ): boolean
  {
    const mapY = Math.floor( y );
    const mapX = Math.floor( x );

    // Check map bounds
    if ( mapY < 0 || mapY >= this.worldMap.length || mapX < 0 || mapX >= this.worldMap[ 0 ].length )
    {
      return false;
    }

    return this.worldMap[ mapY ][ mapX ] === 0;
  }

  /**
   * Rotate the player and camera plane
   */
  rotate ( player: Player, angle: number ): void
  {
    const cosAngle = Math.cos( angle );
    const sinAngle = Math.sin( angle );

    // Rotate direction vector
    const oldDirectionX = player.direction.x;
    player.direction.x = player.direction.x * cosAngle - player.direction.y * sinAngle;
    player.direction.y = oldDirectionX * sinAngle + player.direction.y * cosAngle;

    // Rotate camera plane
    const oldPlaneX = player.plane.x;
    player.plane.x = player.plane.x * cosAngle - player.plane.y * sinAngle;
    player.plane.y = oldPlaneX * sinAngle + player.plane.y * cosAngle;
  }

  /**
   * Handle field of view changes
   */
  handleFieldOfView ( player: Player ): void
  {
    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.INCREASE_FOV ) )
    {
      this.adjustFOV( player, FOV_CHANGE_RATE );
    }

    if ( this.isAnyKeyPressed( MOVEMENT_KEYS.DECREASE_FOV ) )
    {
      this.adjustFOV( player, -FOV_CHANGE_RATE );
    }
  }

  /**
   * Adjust field of view while maintaining aspect ratio
   */
  private adjustFOV ( player: Player, amount: number ): void
  {
    const currentFOV = player.plane.y;
    const targetFOV = amount > 0
      ? Math.min( currentFOV + amount, MAX_FOV )
      : Math.max( currentFOV + amount, MIN_FOV );

    // Only process if there's an actual change
    if ( targetFOV !== currentFOV )
    {
      const ratio = Math.abs( player.plane.x / player.plane.y );
      player.plane.y = targetFOV;
      player.plane.x = targetFOV * ratio * Math.sign( player.plane.x );
    }
  }
}