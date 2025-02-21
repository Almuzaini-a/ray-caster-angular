import { Injectable } from '@angular/core';

@Injectable( {
  providedIn: 'root'
} )
export class WorldGeneratorService
{

  constructor () { }

  generateWorld ( width: number, height: number, algorithm: 'recursive' | 'dfs' | 'cellular' | 'rooms' = 'recursive' ): number[][]
  {
    switch ( algorithm )
    {
      case 'recursive':
        return this.generateRecursiveMaze( width, height );
      case 'dfs':
        return this.generateDFSMaze( width, height );
      case 'cellular':
        return this.generateCaveMap( width, height );
      case 'rooms':
        return this.generateRoomBasedDungeon( width, height );
      default:
        return this.generateRecursiveMaze( width, height );
    }
  }

  private generateRecursiveMaze ( width: number, height: number ): number[][]
  {
    // Start with all cells as walls
    const maze: number[][] = Array( height ).fill( 0 ).map( () =>
      Array( width ).fill( 2 ) // Fill with wall type 2
    );

    // Mark border cells as wall type 1
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( x === 0 || y === 0 || x === width - 1 || y === height - 1 )
        {
          maze[ y ][ x ] = 1;
        }
      }
    }

    // Recursive division - start with entire maze as path
    for ( let y = 1; y < height - 1; y++ )
    {
      for ( let x = 1; x < width - 1; x++ )
      {
        maze[ y ][ x ] = 0; // Path
      }
    }

    // Call recursive division starting with the full interior
    this.divideArea( maze, 1, 1, width - 2, height - 2, 0 );

    // Ensure open area in center for player movement
    const centerX = Math.floor( width / 2 );
    const centerY = Math.floor( height / 2 );
    const clearRadius = Math.max( 2, Math.floor( Math.min( width, height ) * 0.1 ) );

    for ( let y = centerY - clearRadius; y <= centerY + clearRadius; y++ )
    {
      for ( let x = centerX - clearRadius; x <= centerX + clearRadius; x++ )
      {
        if ( x > 0 && x < width - 1 && y > 0 && y < height - 1 )
        {
          maze[ y ][ x ] = 0;
        }
      }
    }

    return maze;
  }

  private divideArea ( maze: number[][], x: number, y: number, width: number, height: number, depth: number ): void
  {
    // Base case - minimum size or maximum recursion
    if ( width < 3 || height < 3 || depth > 5 )
    {
      return;
    }

    // Decide on horizontal or vertical division
    const divideHorizontally = height > width || ( height === width && Math.random() < 0.5 );

    if ( divideHorizontally )
    {
      // Choose a y position for the horizontal wall
      // Ensure it's at an even coordinate for better maze structure
      const wallY = y + 1 + Math.floor( Math.random() * ( height - 2 ) );

      // Choose passage position - ensure it's at an odd coordinate
      const passageX = x + Math.floor( Math.random() * width );

      // Create the wall with a passage
      for ( let i = 0; i < width; i++ )
      {
        if ( x + i < maze[ 0 ].length && wallY < maze.length )
        {
          // Skip the passage
          if ( x + i !== passageX )
          {
            // Random wall type (2-8)
            maze[ wallY ][ x + i ] = Math.floor( Math.random() * 7 ) + 2;
          }
        }
      }

      // Recursively divide the areas above and below the wall
      this.divideArea( maze, x, y, width, wallY - y, depth + 1 );
      this.divideArea( maze, x, wallY + 1, width, y + height - wallY - 1, depth + 1 );
    }
    else
    {
      // Choose an x position for the vertical wall
      // Ensure it's at an even coordinate for better maze structure
      const wallX = x + 1 + Math.floor( Math.random() * ( width - 2 ) );

      // Choose passage position - ensure it's at an odd coordinate
      const passageY = y + Math.floor( Math.random() * height );

      // Create the wall with a passage
      for ( let i = 0; i < height; i++ )
      {
        if ( wallX < maze[ 0 ].length && y + i < maze.length )
        {
          // Skip the passage
          if ( y + i !== passageY )
          {
            // Random wall type (2-8)
            maze[ y + i ][ wallX ] = Math.floor( Math.random() * 7 ) + 2;
          }
        }
      }

      // Recursively divide the areas to the left and right of the wall
      this.divideArea( maze, x, y, wallX - x, height, depth + 1 );
      this.divideArea( maze, wallX + 1, y, x + width - wallX - 1, height, depth + 1 );
    }

    // Add a 50% chance to create an extra passage after depth 2
    // This creates a more interesting maze with multiple possible paths
    if ( depth >= 2 && Math.random() < 0.5 )
    {
      const px = x + Math.floor( Math.random() * width );
      const py = y + Math.floor( Math.random() * height );

      if ( px > 0 && px < maze[ 0 ].length - 1 && py > 0 && py < maze.length - 1 )
      {
        maze[ py ][ px ] = 0;
      }
    }
  }

  private generateDFSMaze ( width: number, height: number ): number[][]
  {
    // Create filled grid (all walls)
    const maze: number[][] = Array( height ).fill( 0 ).map( () => Array( width ).fill( 1 ) );

    // For DFS maze with odd-indexed cells, the last carvable cell should be:
    // - For odd width/height: the second last index (width-2)
    // - For even width/height: the third last index (width-3)
    const lastCarvableX = width % 2 === 0 ? width - 3 : width - 2;
    const lastCarvableY = height % 2 === 0 ? height - 3 : height - 2;

    // Initialize cells that will be part of the maze path system
    // These are the cells at odd coordinates (1, 3, 5, ..., lastCarvable)
    for ( let y = 1; y <= lastCarvableY; y += 2 )
    {
      for ( let x = 1; x <= lastCarvableX; x += 2 )
      {
        maze[ y ][ x ] = 0;
      }
    }

    // Ensure the second-to-last row and column can sometimes be traversed
    for ( let y = 1; y < height - 1; y += 2 )
    {
      // 30% chance to open the second-to-last column
      if ( Math.random() < 0.3 )
      {
        maze[ y ][ width - 2 ] = 0;
      }
    }

    for ( let x = 1; x < width - 1; x += 2 )
    {
      // 30% chance to open the second-to-last row
      if ( Math.random() < 0.3 )
      {
        maze[ height - 2 ][ x ] = 0;
      }
    }

    // Starting point (must be an odd coordinate to be a cell, not a wall)
    const startX = 1;
    const startY = 1;

    // Stack for tracking visited cells
    const stack: [ number, number ][] = [ [ startX, startY ] ];
    const visited: boolean[][] = Array( height ).fill( 0 ).map( () => Array( width ).fill( false ) );
    visited[ startY ][ startX ] = true;

    // Maximum iterations to prevent infinite loops
    let iterations = 0;
    const maxIterations = width * height * 2;

    while ( stack.length > 0 && iterations < maxIterations )
    {
      iterations++;

      const [ currentX, currentY ] = stack[ stack.length - 1 ];
      const neighbors: [ number, number ][] = [];

      // Check all four directions (N, E, S, W)
      const directions = [ [ 0, -2 ], [ 2, 0 ], [ 0, 2 ], [ -2, 0 ] ];

      for ( const [ dx, dy ] of directions )
      {
        const newX = currentX + dx;
        const newY = currentY + dy;

        // Check if this neighbor is valid and unvisited
        // Important: We need to ensure we can carve paths to the second-to-last cell
        if ( newX >= 1 && newX <= lastCarvableX &&
          newY >= 1 && newY <= lastCarvableY &&
          !visited[ newY ][ newX ] )
        {
          neighbors.push( [ newX, newY ] );
        }
      }

      if ( neighbors.length > 0 )
      {
        // Choose a random unvisited neighbor
        const [ nextX, nextY ] = neighbors[ Math.floor( Math.random() * neighbors.length ) ];

        // Carve a passage by removing the wall between cells
        const wallX = currentX + ( nextX - currentX ) / 2;
        const wallY = currentY + ( nextY - currentY ) / 2;
        maze[ wallY ][ wallX ] = 0;

        // Mark the neighbor as visited and push it to the stack
        visited[ nextY ][ nextX ] = true;
        maze[ nextY ][ nextX ] = 0;
        stack.push( [ nextX, nextY ] );
      } else
      {
        // Backtrack
        stack.pop();
      }
    }

    // Ensure the center has some open space
    const centerX = Math.floor( width / 2 );
    const centerY = Math.floor( height / 2 );
    const clearRadius = Math.max( 2, Math.floor( Math.min( width, height ) * 0.1 ) );

    for ( let y = centerY - clearRadius; y <= centerY + clearRadius; y++ )
    {
      for ( let x = centerX - clearRadius; x <= centerX + clearRadius; x++ )
      {
        if ( x >= 1 && x < width - 1 && y >= 1 && y < height - 1 )
        {
          maze[ y ][ x ] = 0;
        }
      }
    }

    // Add some random openings in the edge walls to make sure all areas are accessible
    const edgeOpenings = 8; // Number of random openings to add
    for ( let i = 0; i < edgeOpenings; i++ )
    {
      // Safely initialize x and y with default values
      let x = 1;
      let y = 1;

      // Randomly select one of the four quadrants
      const quadrant = Math.floor( Math.random() * 4 );

      switch ( quadrant )
      {
        case 0: // Top-left
          x = 1 + Math.floor( Math.random() * ( width / 2 - 2 ) );
          y = 1 + Math.floor( Math.random() * ( height / 2 - 2 ) );
          break;
        case 1: // Top-right
          x = Math.floor( width / 2 ) + Math.floor( Math.random() * ( width / 2 - 2 ) );
          y = 1 + Math.floor( Math.random() * ( height / 2 - 2 ) );
          break;
        case 2: // Bottom-left
          x = 1 + Math.floor( Math.random() * ( width / 2 - 2 ) );
          y = Math.floor( height / 2 ) + Math.floor( Math.random() * ( height / 2 - 2 ) );
          break;
        case 3: // Bottom-right
          x = Math.floor( width / 2 ) + Math.floor( Math.random() * ( width / 2 - 2 ) );
          y = Math.floor( height / 2 ) + Math.floor( Math.random() * ( height / 2 - 2 ) );
          break;
      }

      // Make sure this cell and its neighbors are opened
      if ( x >= 1 && x < width - 1 && y >= 1 && y < height - 1 )
      {
        maze[ y ][ x ] = 0;

        // Also open adjacent cells with 50% probability
        const adjacentDirections = [ [ 0, 1 ], [ 1, 0 ], [ 0, -1 ], [ -1, 0 ] ];
        for ( const [ dx, dy ] of adjacentDirections )
        {
          if ( Math.random() < 0.5 )
          {
            const nx = x + dx;
            const ny = y + dy;
            if ( nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1 )
            {
              maze[ ny ][ nx ] = 0;
            }
          }
        }
      }
    }

    // Always ensure the corner areas are accessible
    const corners = [
      { x: 2, y: 2 },                // Top-left
      { x: width - 3, y: 2 },        // Top-right
      { x: 2, y: height - 3 },       // Bottom-left
      { x: width - 3, y: height - 3 } // Bottom-right
    ];

    for ( const corner of corners )
    {
      maze[ corner.y ][ corner.x ] = 0;

      // Also make sure there's a path from this corner toward the center
      const centerDirection = {
        x: corner.x < width / 2 ? 1 : -1,
        y: corner.y < height / 2 ? 1 : -1
      };

      // Create a short path (3 cells) from corner toward center
      for ( let i = 1; i <= 3; i++ )
      {
        const nx = corner.x + ( centerDirection.x * i );
        const ny = corner.y + ( centerDirection.y * i );
        if ( nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1 )
        {
          maze[ ny ][ nx ] = 0;
        }
      }
    }

    // Add random wall types for visual interest
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( maze[ y ][ x ] === 1 )
        {
          maze[ y ][ x ] = Math.floor( Math.random() * 7 ) + 2; // Wall types 2-8
        }
      }
    }

    // Ensure the outermost layer is always wall type 1
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( x === 0 || y === 0 || x === width - 1 || y === height - 1 )
        {
          maze[ y ][ x ] = 1;
        }
      }
    }

    return maze;
  }

  private generateCaveMap ( width: number, height: number ): number[][]
  {
    // Create initial random map with more open space
    let map: number[][] = Array( height ).fill( 0 ).map( () =>
      Array( width ).fill( 0 ).map( () =>
        Math.random() < 0.35 ? 1 : 0  // 35% chance of wall
      )
    );

    // Ensure border walls
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( x === 0 || y === 0 || x === width - 1 || y === height - 1 )
        {
          map[ y ][ x ] = 1;
        }
      }
    }

    // Apply cellular automaton rules (fewer iterations)
    const iterations = 3;

    for ( let i = 0; i < iterations; i++ )
    {
      const newMap: number[][] = JSON.parse( JSON.stringify( map ) );

      for ( let y = 1; y < height - 1; y++ )
      {
        for ( let x = 1; x < width - 1; x++ )
        {
          // Count wall neighbors (including diagonals)
          let wallCount = 0;

          for ( let ny = -1; ny <= 1; ny++ )
          {
            for ( let nx = -1; nx <= 1; nx++ )
            {
              if ( map[ y + ny ][ x + nx ] > 0 )
              {
                wallCount++;
              }
            }
          }

          // Apply rules
          if ( map[ y ][ x ] > 0 )
          {
            // If this is a wall
            newMap[ y ][ x ] = ( wallCount >= 4 ) ? Math.floor( Math.random() * 7 ) + 2 : 0;
          } else
          {
            // If this is open space
            newMap[ y ][ x ] = ( wallCount >= 6 ) ? Math.floor( Math.random() * 7 ) + 2 : 0;
          }
        }
      }

      map = newMap;
    }

    // Ensure a large open area around the center
    const centerX = Math.floor( width / 2 );
    const centerY = Math.floor( height / 2 );
    const clearRadius = Math.max( 2, Math.floor( Math.min( width, height ) * 0.1 ) );

    for ( let y = centerY - clearRadius; y <= centerY + clearRadius; y++ )
    {
      for ( let x = centerX - clearRadius; x <= centerX + clearRadius; x++ )
      {
        if ( x > 0 && x < width - 1 && y > 0 && y < height - 1 )
        {
          map[ y ][ x ] = 0;
        }
      }
    }

    return map;
  }

  private generateRoomBasedDungeon ( width: number, height: number ): number[][]
  {
    // Create a solid grid
    const map: number[][] = Array( height ).fill( 0 ).map( () => Array( width ).fill( 1 ) );

    // Central room
    const centerX = Math.floor( width / 2 );
    const centerY = Math.floor( height / 2 );
    const centerRoomSize = 6;

    // Create the central room
    this.carveRoom( map,
      centerX - Math.floor( centerRoomSize / 2 ),
      centerY - Math.floor( centerRoomSize / 2 ),
      centerRoomSize,
      centerRoomSize
    );

    // Room generation parameters - use fewer rooms with simpler placement
    const numRooms = Math.floor( ( width * height ) / 50 );
    const minRoomSize = Math.max( 3, Math.floor( Math.min( width, height ) * 0.1 ) );
    const maxRoomSize = Math.max( 5, Math.floor( Math.min( width, height ) * 0.2 ) );
    const maxAttempts = 20; // Limit placement attempts per room

    // Track room positions for corridor creation
    const rooms: { x: number, y: number, width: number, height: number; }[] = [
      {
        x: centerX - Math.floor( centerRoomSize / 2 ),
        y: centerY - Math.floor( centerRoomSize / 2 ),
        width: centerRoomSize,
        height: centerRoomSize
      }
    ];

    // Generate rooms
    for ( let i = 0; i < numRooms; i++ )
    {
      let roomPlaced = false;
      let attempts = 0;

      while ( !roomPlaced && attempts < maxAttempts )
      {
        attempts++;

        // Room dimensions
        const roomWidth = Math.floor( Math.random() * ( maxRoomSize - minRoomSize + 1 ) ) + minRoomSize;
        const roomHeight = Math.floor( Math.random() * ( maxRoomSize - minRoomSize + 1 ) ) + minRoomSize;

        // Room position (not too close to edges)
        const roomX = Math.floor( Math.random() * ( width - roomWidth - 2 ) ) + 1;
        const roomY = Math.floor( Math.random() * ( height - roomHeight - 2 ) ) + 1;

        // Simple overlap check
        let canPlace = true;
        for ( const room of rooms )
        {
          // Add 1-cell buffer between rooms
          if ( !( roomX + roomWidth + 1 < room.x ||
            roomX > room.x + room.width + 1 ||
            roomY + roomHeight + 1 < room.y ||
            roomY > room.y + room.height + 1 ) )
          {
            canPlace = false;
            break;
          }
        }

        if ( canPlace )
        {
          // Carve the room
          this.carveRoom( map, roomX, roomY, roomWidth, roomHeight );

          // Store the room for corridor creation
          rooms.push( { x: roomX, y: roomY, width: roomWidth, height: roomHeight } );
          roomPlaced = true;
        }
      }
    }

    // Connect rooms with simplified corridors
    for ( let i = 1; i < rooms.length; i++ )
    {
      const currentRoom = rooms[ i ];
      const prevRoom = rooms[ i - 1 ]; // Connect to the previous room (simpler than nearest)

      // Calculate room centers
      const currentX = currentRoom.x + Math.floor( currentRoom.width / 2 );
      const currentY = currentRoom.y + Math.floor( currentRoom.height / 2 );
      const prevX = prevRoom.x + Math.floor( prevRoom.width / 2 );
      const prevY = prevRoom.y + Math.floor( prevRoom.height / 2 );

      // Simple L-shaped corridor
      if ( Math.random() < 0.5 )
      {
        // Horizontal first, then vertical
        this.drawSimpleCorridor( map, currentX, currentY, prevX, currentY );
        this.drawSimpleCorridor( map, prevX, currentY, prevX, prevY );
      } else
      {
        // Vertical first, then horizontal
        this.drawSimpleCorridor( map, currentX, currentY, currentX, prevY );
        this.drawSimpleCorridor( map, currentX, prevY, prevX, prevY );
      }
    }

    // Add wall types (2-8)
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( map[ y ][ x ] === 1 )
        {
          map[ y ][ x ] = Math.floor( Math.random() * 7 ) + 2;
        }
      }
    }

    // Ensure border walls are type 1
    for ( let y = 0; y < height; y++ )
    {
      for ( let x = 0; x < width; x++ )
      {
        if ( x === 0 || y === 0 || x === width - 1 || y === height - 1 )
        {
          map[ y ][ x ] = 1;
        }
      }
    }

    return map;
  }

  // Helper method for carving rooms
  private carveRoom ( map: number[][], x: number, y: number, width: number, height: number ): void
  {
    for ( let dy = 0; dy < height; dy++ )
    {
      for ( let dx = 0; dx < width; dx++ )
      {
        const posX = x + dx;
        const posY = y + dy;

        if ( posX > 0 && posX < map[ 0 ].length - 1 &&
          posY > 0 && posY < map.length - 1 )
        {
          map[ posY ][ posX ] = 0;
        }
      }
    }
  }

  // Simplified corridor drawing
  private drawSimpleCorridor ( map: number[][], x1: number, y1: number, x2: number, y2: number ): void
  {
    // Draw a line from (x1,y1) to (x2,y2)
    // For a horizontal corridor
    if ( y1 === y2 )
    {
      const startX = Math.min( x1, x2 );
      const endX = Math.max( x1, x2 );

      for ( let x = startX; x <= endX; x++ )
      {
        if ( x > 0 && x < map[ 0 ].length - 1 && y1 > 0 && y1 < map.length - 1 )
        {
          map[ y1 ][ x ] = 0;
        }
      }
    }
    // For a vertical corridor
    else if ( x1 === x2 )
    {
      const startY = Math.min( y1, y2 );
      const endY = Math.max( y1, y2 );

      for ( let y = startY; y <= endY; y++ )
      {
        if ( x1 > 0 && x1 < map[ 0 ].length - 1 && y > 0 && y < map.length - 1 )
        {
          map[ y ][ x1 ] = 0;
        }
      }
    }
  }

  // Helper method to ensure player spawn location is valid
  public ensureValidPlayerSpawn ( map: number[][] ): { x: number, y: number; }
  {
    // Find an open space near the center
    const centerY = Math.floor( map.length / 2 );
    const centerX = Math.floor( map[ 0 ].length / 2 );

    // Start from center and spiral outward until finding an open space
    let radius = 0;
    while ( radius < Math.max( map.length, map[ 0 ].length ) )
    {
      for ( let y = centerY - radius; y <= centerY + radius; y++ )
      {
        for ( let x = centerX - radius; x <= centerX + radius; x++ )
        {
          if ( y >= 0 && y < map.length && x >= 0 && x < map[ 0 ].length )
          {
            if ( map[ y ][ x ] === 0 )
            {
              return { x, y };
            }
          }
        }
      }
      radius++;
    }

    // Fallback
    return { x: centerX, y: centerY };
  }
}