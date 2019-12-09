import { mapping } from '../config.json';
import { IMapping } from './types';

export const mapRelationship = (value: string, fallback: string | number) => {
  const mapped = (mapping as IMapping)[value];

  if (!mapped) {
    return fallback;
  }

  return mapped;
};
