import * as R from 'remeda';

export const dehyphenate = (str: string): string => {
  return str.replace(/^-\s*/, '');
};

export const denumerate = (str: string): string => {
  return str.replace(/^\d+\.?\s*/, '');
};

export const dequote = (str: string): string => {
  return str.replace(/^"/, '').replace(/"$/, '');
};

export const splitlines = (str: string): string[] => {
  return str.split(/\r?\n/);
};

export const unempty = (str: string): boolean => {
  return !!str && str != null;
};

export const cleanOutput = (str: string): string[] => {
  return R.pipe(
    str,
    splitlines,
    R.map(dehyphenate),
    R.map(dequote),
    R.map(denumerate),
    R.filter(unempty)
  );
};
