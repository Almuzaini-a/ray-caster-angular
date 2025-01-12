export interface RenderingSurface
{
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
    bytesPerPixel: number;
}
