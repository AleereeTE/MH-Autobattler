import { mountApp } from './ui/app.ts';

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('Élément #app introuvable dans index.html');
mountApp(root);
