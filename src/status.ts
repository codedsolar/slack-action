/**
 * Type for a job status.
 */
export type Status =
  | 'unknown'
  | 'in-progress'
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped';

/**
 * Interface for options representing a job status.
 */
export interface StatusOptions {
  /** Color in HEX format */
  color: string;

  /** Title of the job status */
  title: string;
}

export default {
  unknown: {
    color: '#1f242b',
    title: 'Unknown',
  },
  'in-progress': {
    color: '#dcad04',
    title: 'In Progress',
  },
  success: {
    color: '#24a943',
    title: 'Success',
  },
  failure: {
    color: '#cc1f2d',
    title: 'Failure',
  },
  cancelled: {
    color: '#1f242b',
    title: 'Cancelled',
  },
  skipped: {
    color: '#1f242b',
    title: 'Skipped',
  },
} as const;
