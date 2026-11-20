import { el } from './dom.ts';
import { mountRun } from './run/run-page.ts';
import { mountSandbox } from './sandbox/sandbox-page.ts';

/**
 * Coquille de l'application : titre, navigation entre les modes, et page affichée.
 * La page est choisie par l'adresse (#run ou #sandbox), pour qu'un rechargement garde le mode.
 */

interface Page {
  readonly id: string;
  readonly label: string;
  /** Affiche la page dans `root` et renvoie la fonction qui la nettoie quand on la quitte. */
  readonly mount: (root: HTMLElement) => () => void;
}

const PAGES: readonly Page[] = [
  { id: 'run', label: 'Mode run', mount: mountRun },
  { id: 'sandbox', label: 'Bac à sable', mount: mountSandbox },
];

function pageFromHash(): Page {
  const id = window.location.hash.replace('#', '');
  return PAGES.find((page) => page.id === id) ?? PAGES[0]!;
}

export function mountApp(root: HTMLElement): void {
  const nav = el('nav', { className: 'app-nav', attrs: { 'aria-label': 'Modes de jeu' } });
  const content = el('div', { className: 'app-content' });
  let cleanup: (() => void) | null = null;

  function show(page: Page): void {
    cleanup?.();
    content.replaceChildren();
    nav.replaceChildren(
      ...PAGES.map((candidate) =>
        el('a', {
          className: 'app-tab',
          text: candidate.label,
          attrs: { href: `#${candidate.id}`, ...(candidate === page ? { 'aria-current': 'page' } : {}) },
        }),
      ),
    );
    cleanup = page.mount(content);
  }

  window.addEventListener('hashchange', () => show(pageFromHash()));
  root.replaceChildren(el('header', { className: 'app-header' }, [el('h1', { text: 'MH Autobattler' }), nav]), content);
  show(pageFromHash());
}
