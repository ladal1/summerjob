import { JobToBePlanned } from '../datasources/DataSource'

export interface Planner {
  start: (planId: string) => Promise<PlanningResult>;
}

export interface PlanningResult {
  success: boolean;
  jobs: JobToBePlanned[];
}
