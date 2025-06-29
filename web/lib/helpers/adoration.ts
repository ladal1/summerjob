/**
 * Check if a worker has adoration during working hours on a given day
 */
export function hasWorkerAdorationOnDay(workerId: string, day: Date, adorationByWorker: Map<string, boolean>): boolean {
  return adorationByWorker.get(workerId) || false
}
