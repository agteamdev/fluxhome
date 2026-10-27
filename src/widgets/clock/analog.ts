import type { TimeParts } from '@/lib/clock';
import { handAngles } from '@/lib/clock';

const NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, cls?: string): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  if (cls) node.setAttribute('class', cls);
  return node;
}

/** Analog clock drawn as SVG (built with DOM calls, colors come from CSS classes). */
export function createAnalogClock(): { element: SVGSVGElement; update: (time: TimeParts) => void } {
  const root = svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': 'Analog clock' }, 'analog');
  root.append(svg('circle', { cx: '50', cy: '50', r: '46' }, 'analog-face'));

  for (let i = 0; i < 12; i++) {
    const long = i % 3 === 0;
    root.append(
      svg(
        'line',
        { x1: '50', y1: long ? '8' : '10', x2: '50', y2: long ? '16' : '14', transform: `rotate(${i * 30} 50 50)` },
        long ? 'analog-tick major' : 'analog-tick',
      ),
    );
  }

  const hour = svg('line', { x1: '50', y1: '50', x2: '50', y2: '28' }, 'analog-hand hour');
  const minute = svg('line', { x1: '50', y1: '50', x2: '50', y2: '17' }, 'analog-hand minute');
  const second = svg('line', { x1: '50', y1: '56', x2: '50', y2: '14' }, 'analog-hand second');
  root.append(hour, minute, second, svg('circle', { cx: '50', cy: '50', r: '2.2' }, 'analog-center'));

  return {
    element: root,
    update(time) {
      const angles = handAngles(time);
      hour.setAttribute('transform', `rotate(${angles.hour} 50 50)`);
      minute.setAttribute('transform', `rotate(${angles.minute} 50 50)`);
      second.setAttribute('transform', `rotate(${angles.second} 50 50)`);
    },
  };
}
