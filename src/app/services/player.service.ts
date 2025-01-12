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
    this.keys[ event.key ] = true;
  }

  handleKeyUp ( event: KeyboardEvent ): void
  {
    this.keys[ event.key ] = false;
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
  }

  handleMovement ( player: Player, frameTime: number ): void
  {
    const moveSpeed: number = frameTime * 5.0;
    const rotSpeed: number = frameTime * 3.0;

    if ( this.keys[ 'w' ] )
    {
      const newVector: Vector = {
        x: player.position.x + player.direction.x * moveSpeed,
        y: player.position.y + player.direction.y * moveSpeed
      };
      if ( WORLD_MAP[ Math.floor( newVector.x ) ][ Math.floor( player.position.y ) ] === 0 )
      {
        player.position.x = newVector.x;
      }
      if ( WORLD_MAP[ Math.floor( player.position.x ) ][ Math.floor( newVector.y ) ] === 0 )
      {
        player.position.y = newVector.y;
      }
    }
    if ( this.keys[ 's' ] )
    {
      const newVector: Vector = {
        x: player.position.x - player.direction.x * moveSpeed,
        y: player.position.y - player.direction.y * moveSpeed
      };
      if ( WORLD_MAP[ Math.floor( newVector.x ) ][ Math.floor( player.position.y ) ] === 0 )
      {
        player.position.x = newVector.x;
      }
      if ( WORLD_MAP[ Math.floor( player.position.x ) ][ Math.floor( newVector.y ) ] === 0 )
      {
        player.position.y = newVector.y;
      }
    }
    if ( this.keys[ 'a' ] ) this.rotate( player, rotSpeed );
    if ( this.keys[ 'd' ] ) this.rotate( player, -rotSpeed );
  }
}
