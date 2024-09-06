import { includes } from 'lodash';

import { ColorCode, Colors } from '../types/colors';
import colors from './tailwind-colors';

const _colors = colors as Colors;

export const getColorHex = (colorCode: ColorCode): string => {
  /* 
    Receives: A color string like 'primary-500'. 
    Returns: The hex value for the colorCode if it exists.
  */

  if (!includes(colorCode, '-')) {
    throw new Error(`Color ${colorCode} does not exist`);
  }

  const name = colorCode.split('-')[0];
  const shade = colorCode.split('-')[1];

  if (!_colors[name]) {
    throw new Error(`Color ${name} does not exist`);
  }
  if (!_colors[name][shade]) {
    throw new Error(`Shade ${shade} does not exist for color ${name}`);
  }

  return _colors[name][shade];
};

export const getRandomColor = (): ColorCode => {
  /* 
    Returns: A random vibrant color with shade 500 (gray colors are excluded).
  */

  delete _colors.gray;
  const colorNames = Object.keys(_colors);
  const randomColorName = colorNames[Math.floor(Math.random() * colorNames.length)];
  const colorShade = '500';

  return `${randomColorName}-${colorShade}`;
};

export const isColorCode = (colorCode: string): boolean => {
  /* 
    Receives: A color string like 'primary-500'. 
    Returns: True if the colorCode exists.
  */

  if (!includes(colorCode, '-')) {
    return false;
  }

  const name = colorCode.split('-')[0];
  const shade = colorCode.split('-')[1];

  if (!_colors[name]) {
    return false;
  }
  if (!_colors[name][shade]) {
    return false;
  }

  return true;
};

export default _colors;
