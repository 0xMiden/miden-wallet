import colors from '../utils/tailwind-colors';

export interface Colors {
  [key: string]: {
    [key: string]: string;
  };
}

const _colors = colors as Colors;

export type ColorCode = keyof typeof _colors extends infer ColorName
  ? ColorName extends keyof typeof _colors
    ? keyof typeof _colors[ColorName] extends infer Shade
      ? Shade extends keyof typeof _colors[ColorName]
        ? `${ColorName & string}-${Shade & string}`
        : never
      : never
    : never
  : never;
