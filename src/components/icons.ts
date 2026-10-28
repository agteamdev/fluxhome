const NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

/** Yellow warning triangle with an exclamation mark (used for overdue tasks). The tooltip comes from data-tip. */
export function warningIcon(label: string): SVGSVGElement {
  const icon = svg('svg', { viewBox: '0 0 16 16', width: '16', height: '16', role: 'img', 'aria-label': label, 'data-tip': label, class: 'warn-icon' });
  icon.append(
    svg('path', { d: 'M8 1.8 L15 14 H1 Z', fill: '#f5b82e', stroke: '#c98a00', 'stroke-width': '1', 'stroke-linejoin': 'round' }),
    svg('line', { x1: '8', y1: '6', x2: '8', y2: '9.6', stroke: '#3a2a00', 'stroke-width': '1.6', 'stroke-linecap': 'round' }),
    svg('circle', { cx: '8', cy: '11.9', r: '0.95', fill: '#3a2a00' }),
  );
  return icon;
}

/** A gear (settings) icon drawn from geometry: 8 teeth around a round hole. Uses the current text color. */
export function gearIcon(size = 18): SVGSVGElement {
  const teeth = 8;
  const inner = 6.4;
  const outer = 9;
  const point = (radius: number, degrees: number): string => {
    const angle = ((degrees - 90) * Math.PI) / 180;
    return `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12 + radius * Math.sin(angle)).toFixed(2)}`;
  };
  const outline: string[] = [];
  for (let k = 0; k < teeth; k++) {
    const center = (k * 360) / teeth;
    outline.push(point(inner, center - 17), point(outer, center - 10), point(outer, center + 10), point(inner, center + 17));
  }
  const hole = 'M15 12 A3 3 0 1 0 9 12 A3 3 0 1 0 15 12 Z';
  const icon = svg('svg', { viewBox: '0 0 24 24', width: String(size), height: String(size), 'aria-hidden': 'true' });
  icon.append(svg('path', { d: `M${outline.join(' L')} Z ${hole}`, fill: 'currentColor', 'fill-rule': 'evenodd' }));
  return icon;
}
