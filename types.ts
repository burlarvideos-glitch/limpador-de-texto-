
export enum CleanMode {
  INDIVIDUAL_CHARS = 'INDIVIDUAL_CHARS',
  LITERAL_STRING = 'LITERAL_STRING',
  REGEX = 'REGEX'
}

export interface HistoryItem {
  id: string;
  original: string;
  cleaned: string;
  timestamp: number;
  removedChars: string;
}
