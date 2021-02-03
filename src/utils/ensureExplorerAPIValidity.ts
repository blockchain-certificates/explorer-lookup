import { ExplorerAPI } from '../models/Explorers';

function isPriorityValid (explorerAPI: ExplorerAPI): boolean {
  return explorerAPI.priority >= 0 && explorerAPI.priority <= 1;
}

function isParsingFunctionValid (explorerAPI: ExplorerAPI): boolean {
  return typeof explorerAPI.parsingFunction === 'function';
}

export default function ensureExplorerAPIValidity (explorerAPIs: ExplorerAPI[] = []): boolean {
  if (explorerAPIs.length === 0) {
    return false;
  }

  if (explorerAPIs.some(explorerAPI => !isPriorityValid(explorerAPI))) {
    throw new Error('One or more of your custom explorer APIs has a priority set below 0 or above 1. ' +
      'Use 0 to give precedence to custom explorers over the default ones, or 1 for the contrary.');
  }

  if (explorerAPIs.some(explorerAPI => !isParsingFunctionValid(explorerAPI))) {
    throw new Error('One or more of your custom explorer APIs does not have a parsing function. ' +
      'Parsing functions are required to convert the data received from the explorer.');
  }

  return true;
}
