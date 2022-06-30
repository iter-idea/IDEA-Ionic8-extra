/**
 * A color in the palette.
 */
export interface Color {
  name?: string;
  hex: string;
}

/**
 * Some nice colors to use in the web.
 */
export const COLORS: Color[] = [
  { name: 'Radicchio', hex: '#AD1457' },
  { name: 'Tangerine', hex: '#F4511E' },
  { name: 'Citron', hex: '#E4C441' },
  { name: 'Basil', hex: '#0B8043' },
  { name: 'Blueberry', hex: '#3F51B5' },
  { name: 'Grape', hex: '#8E24AA' },
  { name: 'Blossom', hex: '#D81B60' },
  { name: 'Pumpkin', hex: '#EF6C00' },
  { name: 'Avocado', hex: '#C0CA33' },
  { name: 'Eucalyptus', hex: '#009688' },
  { name: 'Lavander', hex: '#7986CB' },
  { name: 'Cocoa', hex: '#795548' },
  { name: 'Tomato', hex: '#D50000' },
  { name: 'Mango', hex: '#F09300' },
  { name: 'Pistachio', hex: '#7CB342' },
  { name: 'Peacock', hex: '#039BE5' },
  { name: 'Wisteria', hex: '#B39DDB' },
  { name: 'Graphite', hex: '#616161' },
  { name: 'Flamingo', hex: '#E67C73' },
  { name: 'Banana', hex: '#F6BF26' },
  { name: 'Sage', hex: '#33B679' },
  { name: 'Cobalt', hex: '#039BE5' },
  { name: 'Amethyst', hex: '#9E69AF' },
  { name: 'Birch', hex: '#A79B8E' }
];
