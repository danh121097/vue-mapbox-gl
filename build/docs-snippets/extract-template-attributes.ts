/**
 * Pulls the attributes a Vue example puts on this package's components.
 *
 * An unknown attribute on a component is legal Vue -- it falls through to the
 * root element -- so `vue-tsc` compiles `<Maplibre :option="…" />` without a
 * word. The examples are copied verbatim by readers, and a prop that silently
 * does nothing is the least debuggable kind of wrong.
 */

export interface TemplateAttribute {
  component: string;
  /** The prop name the attribute maps to: `:source-id` becomes `sourceId`. */
  prop: string;
  /** The attribute as written, for the message. */
  written: string;
  /** 0-based line within the snippet. */
  line: number;
}

/**
 * Attributes that are legal on any component and mean nothing about its props:
 * fallthrough attributes Vue itself defines, and the DOM's own.
 */
const UNIVERSAL = new Set(['class', 'style', 'key', 'ref', 'is', 'slot', 'id']);

function isUniversal(name: string): boolean {
  return (
    UNIVERSAL.has(name) ||
    name.startsWith('v-') ||
    name.startsWith('data-') ||
    name.startsWith('aria-')
  );
}

/** `source-id` -> `sourceId`, which is the key Vue puts on `$props`. */
export function toCamelCase(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Scans an opening tag from `<`, respecting quoted values -- an inline arrow
 * function (`:register="(a) => a.isMapReady"`) puts a `>` inside a value, so
 * stopping at the first `>` would cut the tag in half.
 */
function readTag(source: string, start: number): { body: string; end: number } {
  let quote: string | null = null;
  for (let i = start; i < source.length; i++) {
    const char = source[i]!;
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '>') return { body: source.slice(start, i), end: i };
  }
  return { body: source.slice(start), end: source.length };
}

/** An attribute name, with its binding or handler prefix. */
const ATTRIBUTE_RE = /^(v-bind:|v-on:|[:@#])?([A-Za-z_][\w.-]*)/;

/**
 * Splits an opening tag's body into its attributes, skipping over quoted
 * values. Reading names straight out of the body would find them inside the
 * values too -- `style="width: 100%"` would report a `width` prop, and
 * `:draggable="true"` a `true` one.
 */
function attributesOf(body: string): { text: string; offset: number }[] {
  const attributes: { text: string; offset: number }[] = [];
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i]!)) i++;
    if (i >= body.length) break;

    const offset = i;
    while (i < body.length && !/[\s=]/.test(body[i]!)) i++;
    const text = body.slice(offset, i);
    if (text) attributes.push({ text, offset });

    while (i < body.length && /\s/.test(body[i]!)) i++;
    if (body[i] !== '=') continue;
    i++;
    while (i < body.length && /\s/.test(body[i]!)) i++;

    const quote = body[i];
    if (quote === '"' || quote === "'") {
      i++;
      while (i < body.length && body[i] !== quote) i++;
      i++;
    } else {
      while (i < body.length && !/\s/.test(body[i]!)) i++;
    }
  }
  return attributes;
}

/**
 * Native events a component passes to its root element for free. Vue's
 * fallthrough makes `@click` on a component that emits no `click` a real DOM
 * listener on its root, which is normal usage -- so only a handler that is
 * neither an emit nor a DOM event is worth reporting.
 */
const DOM_EVENTS = new Set([
  'blur',
  'change',
  'click',
  'contextmenu',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'focus',
  'input',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointerdown',
  'pointermove',
  'pointerup',
  'scroll',
  'submit',
  'touchend',
  'touchmove',
  'touchstart',
  'wheel',
]);

export function extractTemplateAttributes(
  code: string,
  components: Set<string>,
): TemplateAttribute[] {
  const found: TemplateAttribute[] = [];
  const tagStart = /<([A-Z][A-Za-z0-9]*)/g;

  // Only the template. A `<script setup>` writes `ref<Marker | null>(null)`,
  // which is a type argument, not a tag.
  const fullCode = code;
  const template = /<template>([\s\S]*)<\/template>/.exec(code);
  if (!template) return found;
  const offset = template.index + '<template>'.length;
  code = template[1]!;

  const prefixLines = fullCode.slice(0, offset).split('\n').length - 1;

  for (const match of code.matchAll(tagStart)) {
    const component = match[1]!;
    if (!components.has(component)) continue;

    const { body } = readTag(code, match.index + match[0].length);
    const line =
      prefixLines + code.slice(0, match.index).split('\n').length - 1;

    for (const { text, offset } of attributesOf(body)) {
      const attribute = ATTRIBUTE_RE.exec(text);
      if (!attribute) continue;
      const prefix = attribute[1] ?? '';
      const name = attribute[2]!;
      // A dynamic name (`:[key]="…"`) or a slot is not a prop to check.
      if (prefix === '#' || name.startsWith('[')) continue;
      if (isUniversal(name)) continue;
      // A modifier (`@click.stop`) is not part of the name.
      const bare = name.split('.')[0]!;
      const isHandler = prefix === '@' || prefix === 'v-on:';
      if (isHandler && DOM_EVENTS.has(bare.toLowerCase())) continue;
      const camel = toCamelCase(bare);
      found.push({
        component,
        prop: isHandler
          ? `on${camel[0]!.toUpperCase()}${camel.slice(1)}`
          : camel,
        written: `${prefix}${name}`,
        line: line + body.slice(0, offset).split('\n').length - 1,
      });
    }
  }

  return found;
}
