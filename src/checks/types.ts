export type Severity = 'error' | 'warning' | 'info';

export type NavigationTarget =
  | { type: 'contentType'; id: string }
  | { type: 'entry'; id: string };

export type Finding = {
  id: string;
  severity: Severity;
  category?: string;
  message: string;
  target: NavigationTarget | null;
};

export type CategoryStatus = 'idle' | 'running' | 'complete' | 'error';
