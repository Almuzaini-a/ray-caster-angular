import { Injectable } from '@angular/core';
import { WallColor } from '../interfaces/wall-color.interface';

@Injectable( {
  providedIn: 'root'
} )
export class WallColorService
{
  private lastUpdate: number = Date.now();
  private readonly updateInterval: number = 3000; // 5 seconds
  private currentColors: Map<number, WallColor> = new Map();

  // Fixed colors 
  private readonly fixedColors: WallColor[] = [
    { r: 204, g: 102, b: 0 },    // Brown (wall type 1)
    { r: 128, g: 128, b: 128 },  // Floor gray
    { r: 135, g: 206, b: 235 }   // Ceiling blue
  ];

  // Base colors for walls 2-8
  private readonly baseColors: WallColor[] = [
    { r: 204, g: 0, b: 0 },      // Dark Red
    { r: 153, g: 51, b: 153 },   // Purple
    { r: 204, g: 153, b: 0 },    // Orange
    { r: 102, g: 51, b: 0 },     // Deep Brown
    { r: 153, g: 0, b: 76 },     // Wine Red
    { r: 102, g: 0, b: 102 }     // Deep Purple
  ];

  private generateRandomColor (): WallColor
  {
    const baseColor: WallColor = this.baseColors[ Math.floor( Math.random() * this.baseColors.length ) ];

    return {
      r: Math.min( 255, Math.max( 0, baseColor.r + Math.floor( Math.random() * 41 ) - 20 ) ),
      g: Math.min( 255, Math.max( 0, baseColor.g + Math.floor( Math.random() * 41 ) - 20 ) ),
      b: Math.min( 255, Math.max( 0, baseColor.b + Math.floor( Math.random() * 41 ) - 20 ) )
    };
  }

  private shouldUpdateColors (): boolean
  {
    const now: number = Date.now();
    if ( now - this.lastUpdate > this.updateInterval )
    {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  getWallColor ( wallType: number, side: number ): WallColor
  {
    if ( wallType === 1 )
    {
      return { ...this.fixedColors[ 0 ] };
    }

    if ( this.shouldUpdateColors() )
    {
      for ( let i: number = 2; i <= 8; i++ )
      {
        this.currentColors.set( i, this.generateRandomColor() );
      }
    }

    let color: WallColor | undefined = this.currentColors.get( wallType );
    if ( !color )
    {
      color = this.generateRandomColor();
      this.currentColors.set( wallType, color );
    }

    color = { ...color };

    if ( side === 1 )
    {
      color.r = Math.floor( color.r * 0.7 );
      color.g = Math.floor( color.g * 0.7 );
      color.b = Math.floor( color.b * 0.7 );
    }

    return color;
  }
}
