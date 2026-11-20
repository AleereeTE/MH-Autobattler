/** Petit utilitaire pour créer des éléments HTML sans passer par innerHTML. */

type Child = Node | string | null | undefined | false;

export interface ElementOptions {
  readonly className?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly onClick?: (event: MouseEvent) => void;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className !== undefined) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) node.setAttribute(name, value);
  const onClick = options.onClick;
  if (onClick !== undefined) (node as HTMLElement).addEventListener('click', (event) => onClick(event));
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) node.append(child);
  }
  return node;
}

export function button(text: string, onClick: () => void, className = 'button'): HTMLButtonElement {
  return el('button', { className, text, attrs: { type: 'button' }, onClick: () => onClick() });
}

export function select(
  options: readonly { readonly value: string; readonly label: string }[],
  selected?: string,
): HTMLSelectElement {
  const node = el('select');
  for (const option of options) {
    const item = el('option', { text: option.label, attrs: { value: option.value } });
    if (option.value === selected) item.selected = true;
    node.append(item);
  }
  return node;
}
