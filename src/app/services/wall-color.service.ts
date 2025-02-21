import { Injectable } from '@angular/core';
import { WallColor } from '../interfaces/wall-color.interface';

// Color constants
const SIDE_WALL_DIMMING_FACTOR = 0.7;
const COLOR_VARIATION_RANGE = 20;
const DEFAULT_UPDATE_INTERVAL = 3000; // 3 seconds

@Injectable( {
  providedIn: 'root'
} )
export class WallColorService
{
  private lastUpdate: number = Date.now();
  private readonly updateInterval: number = DEFAULT_UPDATE_INTERVAL;
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

  /**
   * Generate a random color variation from a base color
   */
  private generateRandomColor (): WallColor
  {
    // Pick a random base color
    const baseColor = this.baseColors[ Math.floor( Math.random() * this.baseColors.length ) ];

    // Create a variation of that color
    return {
      r: this.clampColorValue( baseColor.r + Math.floor( Math.random() * COLOR_VARIATION_RANGE * 2 ) - COLOR_VARIATION_RANGE ),
      g: this.clampColorValue( baseColor.g + Math.floor( Math.random() * COLOR_VARIATION_RANGE * 2 ) - COLOR_VARIATION_RANGE ),
      b: this.clampColorValue( baseColor.b + Math.floor( Math.random() * COLOR_VARIATION_RANGE * 2 ) - COLOR_VARIATION_RANGE )
    };
  }

  /**
   * Clamp a color value to the valid range (0-255)
   */
  private clampColorValue ( value: number ): number
  {
    return Math.min( 255, Math.max( 0, value ) );
  }

  /**
   * Check if the colors should be updated based on elapsed time
   */
  private shouldUpdateColors (): boolean
  {
    const now = Date.now();
    if ( now - this.lastUpdate > this.updateInterval )
    {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  /**
   * Get wall color based on wall type and which side is hit
   */
  getWallColor ( wallType: number, side: number ): WallColor
  {
    // Special case for wall type 1 (fixed color)
    if ( wallType === 1 )
    {
      return { ...this.fixedColors[ 0 ] };
    }

    // Check if colors need updating based on time interval
    if ( this.shouldUpdateColors() )
    {
      this.updateAllColors();
    }

    // Get or generate color for the wall type
    let color = this.getOrGenerateColorForWallType( wallType );

    // Dim the color if it's a y-side (to create shadow effect)
    if ( side === 1 )
    {
      color = this.dimColor( color, SIDE_WALL_DIMMING_FACTOR );
    }

    return color;
  }

  /**
   * Get existing color for wall type or generate a new one
   */
  private getOrGenerateColorForWallType ( wallType: number ): WallColor
  {
    let color = this.currentColors.get( wallType );
    if ( !color )
    {
      color = this.generateRandomColor();
      this.currentColors.set( wallType, color );
    }

    // Return a copy to prevent modification of stored colors
    return { ...color };
  }

  /**
   * Dim a color by a specified factor
   */
  private dimColor ( color: WallColor, factor: number ): WallColor
  {
    return {
      r: Math.floor( color.r * factor ),
      g: Math.floor( color.g * factor ),
      b: Math.floor( color.b * factor )
    };
  }

  /**
   * Update all dynamic wall colors
   */
  private updateAllColors (): void
  {
    // Update colors for wall types 2-8
    for ( let i = 2; i <= 8; i++ )
    {
      this.currentColors.set( i, this.generateRandomColor() );
    }
  }
}