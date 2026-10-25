import { Category, Channel } from './models';

export const DEFAULT_GROUP = 'Sin categoría';

const attrRegex = /([A-Za-z0-9_-]+)="([^"]*)"/g;

export const M3uParser = {
  DEFAULT_GROUP,

  parse(content: string): { categories: Category[]; channels: Channel[] } {
    const lines = content.split(/\r?\n/);
    const channels: Channel[] = [];
    const groups = new Set<string>();

    let pending = false;
    let name = '';
    let logo: string | null = null;
    let group = DEFAULT_GROUP;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.toUpperCase().startsWith('#EXTINF')) {
        const attrs: Record<string, string> = {};
        let match: RegExpExecArray | null;
        attrRegex.lastIndex = 0;
        while ((match = attrRegex.exec(line)) !== null) {
          attrs[match[1].toLowerCase()] = match[2];
        }

        let afterAttrs = line;
        const lastQuote = line.lastIndexOf('"');
        if (lastQuote !== -1) {
          afterAttrs = line.slice(lastQuote + 1);
        }
        const commaIndex = afterAttrs.indexOf(',');
        const title = commaIndex !== -1 ? afterAttrs.slice(commaIndex + 1).trim() : '';

        name = title || attrs['tvg-name'] || `Canal ${channels.length + 1}`;
        logo = attrs['tvg-logo'] && attrs['tvg-logo'].trim() ? attrs['tvg-logo'].trim() : null;
        group = (attrs['group-title'] && attrs['group-title'].trim()) || DEFAULT_GROUP;
        pending = true;
      } else if (line.startsWith('#')) {
        if (pending && line.toUpperCase().startsWith('#EXTGRP:')) {
          const g = line.slice(8).trim();
          if (g) group = g;
        }
      } else if (pending) {
        channels.push({
          id: channels.length.toString(),
          name,
          logo,
          categoryId: group,
          url: line,
          altUrl: null,
        });
        groups.add(group);
        pending = false;
      }
    }

    const categories: Category[] = Array.from(groups).map((g) => ({
      id: g,
      name: g,
    }));

    return { categories, channels };
  },
};
