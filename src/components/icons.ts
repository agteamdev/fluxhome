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

export type IconName = 'edit' | 'delete' | 'close' | 'pin' | 'unpin' | 'play' | 'pause' | 'stop' | 'bell' | 'bellOff' | 'import';

interface IconShape {
  d: string[];
  fill?: boolean;
}

/** Outline icons on a 16x16 grid. They use the text color, so they adapt to every theme and background. */
const SHAPES: Record<IconName, IconShape> = {
  edit: { d: ['M11 2.6l2.4 2.4-8 8H3v-2.4l8-8z', 'M9.6 4l2.4 2.4'] },
  delete: { d: ['M3 4.5h10', 'M6.5 4.5V3h3v1.5', 'M4.4 4.5l.6 8.5h6l.6-8.5', 'M7 7v4M9 7v4'] },
  close: { d: ['M4 4l8 8M12 4l-8 8'] },
  pin: { d: ['M8 1.9l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13.4l.8-4.2L2 6.3l4.2-.5L8 1.9z'] },
  unpin: { d: ['M8 1.9l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13.4l.8-4.2L2 6.3l4.2-.5L8 1.9z'], fill: true },
  play: { d: ['M5 3.2v9.6L12.8 8 5 3.2z'], fill: true },
  pause: { d: ['M4.5 3.5h2.4v9H4.5z', 'M9.1 3.5h2.4v9H9.1z'], fill: true },
  stop: { d: ['M4 4h8v8H4z'], fill: true },
  bell: { d: ['M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.4H2.8L4 11z', 'M6.6 14h2.8'] },
  bellOff: { d: ['M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.4H2.8L4 11z', 'M6.6 14h2.8', 'M2.5 2.5l11 11'] },
  import: { d: ['M8 2.5v8M4.8 7.6L8 10.8l3.2-3.2', 'M3 13h10'] },
};

export function icon(name: IconName, size = 15): SVGSVGElement {
  const shape = SHAPES[name];
  const node = svg('svg', { viewBox: '0 0 16 16', width: String(size), height: String(size), 'aria-hidden': 'true', focusable: 'false' });
  for (const d of shape.d) {
    node.append(
      svg('path', {
        d,
        fill: shape.fill ? 'currentColor' : 'none',
        stroke: 'currentColor',
        'stroke-width': '1.4',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
  }
  return node;
}
