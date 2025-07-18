import { startsWith } from './string.js';

export function prependHashPrefix (remoteHash: string, prefixes: string[]): string {
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    if (!startsWith(remoteHash, prefix)) {
      return `${prefix}${remoteHash}`;
    }
  }
  return remoteHash;
}
