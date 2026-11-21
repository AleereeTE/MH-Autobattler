import { el } from '../dom.ts';

/**
 * Petite fenêtre d'aperçu ouverte au clic droit, près de la souris.
 * Une seule à la fois ; elle se ferme au clic ailleurs ou avec Échap.
 */

let current: HTMLElement | null = null;
let listening = false;

function listenOnce(): void {
  if (listening) return;
  listening = true;
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (current !== null && !current.contains(event.target as Node)) hidePopover();
    },
    true,
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hidePopover();
  });
}

export function hidePopover(): void {
  current?.remove();
  current = null;
}

/** Affiche `content` près du point (x, y) de l'écran, sans déborder de la fenêtre. */
export function showPopover(content: HTMLElement, x: number, y: number): void {
  listenOnce();
  hidePopover();
  const box = el('div', { className: 'popover', attrs: { role: 'dialog' } }, [content]);
  document.body.append(box);
  const { width, height } = box.getBoundingClientRect();
  box.style.left = `${Math.max(8, Math.min(x + 12, window.innerWidth - width - 8))}px`;
  box.style.top = `${Math.max(8, Math.min(y + 12, window.innerHeight - height - 8))}px`;
  current = box;
}

/** Ouvre l'aperçu construit par `build` quand on fait un clic droit sur `element`. */
export function onRightClick(element: HTMLElement, build: () => HTMLElement): HTMLElement {
  element.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    showPopover(build(), event.clientX, event.clientY);
  });
  return element;
}
