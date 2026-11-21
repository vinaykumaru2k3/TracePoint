/** Isometric projection on a 2:1 grid. x runs right-down, y runs left-down, z is height in pixels. */
export const U = 36;

export interface Pt { x: number; y: number }

export const project = (x: number, y: number, z = 0): Pt => ({ x: (x - y) * U, y: ((x + y) * U) / 2 - z });

/** viewBox string that fits grid points [x, y, z], so a scene keeps one stable frame while its contents change. */
export function fitBox(points: [number, number, number][], pad = 24): string {
  const ps = points.map(([x, y, z]) => project(x, y, z));
  const minX = Math.min(...ps.map((p) => p.x)) - pad, maxX = Math.max(...ps.map((p) => p.x)) + pad;
  const minY = Math.min(...ps.map((p) => p.y)) - pad, maxY = Math.max(...ps.map((p) => p.y)) + pad;
  return `${Math.round(minX)} ${Math.round(minY)} ${Math.round(maxX - minX)} ${Math.round(maxY - minY)}`;
}

export const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
