import { mountSandbox } from './ui/sandbox/sandbox-page.ts';

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('Élément #app introuvable dans index.html');
mountSandbox(root);
