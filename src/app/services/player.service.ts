import { Injectable } from '@angular/core';
import { Player } from '../interfaces/player.interface';
import { Vector } from '../interfaces/vector.interface';
import { WORLD_MAP } from '../constants/world-map.constant';

@Injectable( {
  providedIn: 'root'
} )
export class PlayerService
{

  private keys: { [ key: string ]: boolean; } = {};

  handleKeyDown ( event: KeyboardEvent ): void
  {
    const normalizedKey: string = this.normalizeKey( event.key );
    this.keys[ normalizedKey ] = true;
  }

  handleKeyUp ( event: KeyboardEvent ): void
  {
    const normalizedKey: string = this.normalizeKey( event.key );
    this.keys[ normalizedKey ] = false;
  }

  private normalizeKey ( key: string ): string
  {
    return /^[A-Za-z]$/.test( key ) ? key.toLowerCase() : key;
  }

  rotate ( player: Player, angle: number ): void
  {
    const oldDirectionX: number = player.direction.x;
    player.direction.x =
      player.direction.x * Math.cos( angle ) - player.direction.y * Math.sin( angle );
    player.direction.y =
      oldDirectionX * Math.sin( angle ) + player.direction.y * Math.cos( angle );

    const oldPlaneX: number = player.plane.x;
    player.plane.x =
      player.plane.x * Math.cos( angle ) - player.plane.y * Math.sin( angle );
    player.plane.y =
      oldPlaneX * Math.sin( angle ) + player.plane.y * Math.cos( angle );
  };

  handleMovement ( player: Player, frameTime: number ): void
  {
    const moveSpeed: number = frameTime * 5.0;
    const rotSpeed: number = frameTime * 3.0;

    if ( this.keys[ 'w' ] || this.keys[ 'ArrowUp' ] )
    {
      const newVector: Vector = {
        x: player.position.x + player.direction.x * moveSpeed,
        y: player.position.y + player.direction.y * moveSpeed
      };
      if ( WORLD_MAP[ Math.floor( player.position.y ) ][ Math.floor( newVector.x ) ] === 0 )
      {
        player.position.x = newVector.x;
      }
      if ( WORLD_MAP[ Math.floor( newVector.y ) ][ Math.floor( player.position.x ) ] === 0 )
      {
        player.position.y = newVector.y;
      }
    }

    if ( this.keys[ 's' ] || this.keys[ 'ArrowDown' ] )
    {
      const newVector: Vector = {
        x: player.position.x - player.direction.x * moveSpeed,
        y: player.position.y - player.direction.y * moveSpeed
      };
      if ( WORLD_MAP[ Math.floor( player.position.y ) ][ Math.floor( newVector.x ) ] === 0 )
      {
        player.position.x = newVector.x;
      }
      if ( WORLD_MAP[ Math.floor( newVector.y ) ][ Math.floor( player.position.x ) ] === 0 )
      {
        player.position.y = newVector.y;
      }
    }

    if ( this.keys[ 'a' ] || this.keys[ 'ArrowLeft' ] ) this.rotate( player, rotSpeed );
    if ( this.keys[ 'd' ] || this.keys[ 'ArrowRight' ] ) this.rotate( player, -rotSpeed );
  }

  handleFieldOfView ( player: Player ): void
  {
    const FOV_CHANGE_RATE = 0.01;
    const MIN_FOV = 0.30;
    const MAX_FOV = 0.90;

    if ( this.keys[ 'e' ] )
    {
      if ( player.plane.y < MAX_FOV )
      {
        const newFOV: number = Math.min( player.plane.y + FOV_CHANGE_RATE, MAX_FOV );
        const ratio: number = Math.abs( player.plane.x / player.plane.y );
        player.plane.y = newFOV;
        player.plane.x = newFOV * ratio * Math.sign( player.plane.x );
      }
    }

    if ( this.keys[ 'q' ] )
    {
      if ( player.plane.y > MIN_FOV )
      {
        const newFOV: number = Math.max( player.plane.y - FOV_CHANGE_RATE, MIN_FOV );
        const ratio: number = Math.abs( player.plane.x / player.plane.y );
        player.plane.y = newFOV;
        player.plane.x = newFOV * ratio * Math.sign( player.plane.x );
      }
    }
  }
}
