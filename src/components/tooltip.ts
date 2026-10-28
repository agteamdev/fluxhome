/**
 * Tooltips in the extension design (the browser's own tooltips cannot be styled).
 *
 * Works for every element with a `title` or `data-tip` attribute. On first hover the `title` is moved to
 * `data-tip`, so the native tooltip never appears. Call initTooltips() once per page.
 */
const SHOW_DELAY_MS = 350;

export function initTooltips(): void {
  let tip: HTMLElement | null = null;
  let current: HTMLElement | null = null;
  let timer: number | undefined;

  const hide = (): void => {
    window.clearTimeout(timer);
    tip?.remove();
    tip = null;
    current = null;
  };

  const place = (target: HTMLElement, bubble: HTMLElement): void => {
    const rect = target.getBoundingClientRect();
    const margin = 8;
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - margin - width));
    const above = rect.top - height - 6;
    bubble.style.left = `${left}px`;
    bubble.style.top = `${above >= margin ? above : rect.bottom + 6}px`;
  };

  const show = (target: HTMLElement, text: string): void => {
    const bubble = document.createElement('div');
    bubble.className = 'tooltip';
    bubble.setAttribute('role', 'tooltip');
    bubble.textContent = text;
    // Inside a dialog the tooltip must be a child of the dialog, or it would be hidden behind it
    (target.closest('dialog') ?? document.body).append(bubble);
    place(target, bubble);
    tip = bubble;
  };

  const schedule = (target: HTMLElement, delay: number): void => {
    if (target === current) return;
    hide();
    const title = target.getAttribute('title');
    if (title !== null) {
      target.setAttribute('data-tip', title);
      target.removeAttribute('title');
    }
    const text = target.getAttribute('data-tip');
    if (!text) return;
    current = target;
    timer = window.setTimeout(() => show(target, text), delay);
  };

  const findTarget = (node: EventTarget | null): HTMLElement | null =>
    node instanceof Element ? node.closest<HTMLElement>('[title], [data-tip]') : null;

  document.addEventListener('mouseover', (event) => {
    const target = findTarget(event.target);
    if (target) schedule(target, SHOW_DELAY_MS);
  });
  document.addEventListener('mouseout', (event) => {
    if (current && !current.contains(event.relatedTarget as Node | null)) hide();
  });
  document.addEventListener('focusin', (event) => {
    const target = findTarget(event.target);
    if (target && target.matches(':focus-visible')) schedule(target, 0);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('keydown', hide, true);
  document.addEventListener('dragstart', hide, true);
  window.addEventListener('scroll', hide, true);
}
