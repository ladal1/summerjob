import { ActiveJobNoPlan } from "lib/types/active-job";
import { WorkerComplete, WorkerWithAllergies } from "lib/types/worker";
import { ExpandableRow } from "../table/ExpandableRow";
import { SimpleRow } from "../table/SimpleRow";
import type { Worker } from "lib/prisma/client";
import { useAPIActiveJobUpdateDynamic } from "lib/fetcher/active-job";
import { useEffect, useState } from "react";
import { translateAllergies } from "lib/types/allergy";

interface PlanJoblessRowProps {
  planId: string;
  jobs: ActiveJobNoPlan[];
  joblessWorkers: WorkerComplete[];
  numColumns: number;
  onWorkerDragStart: (
    worker: Worker,
    sourceId: string
  ) => (e: React.DragEvent<HTMLTableRowElement>) => void;
  reloadJoblessWorkers: () => void;
}

export function PlanJoblessRow({
  planId,
  jobs,
  joblessWorkers,
  numColumns,
  onWorkerDragStart,
  reloadJoblessWorkers,
}: PlanJoblessRowProps) {
  const [sourceJobId, setSourceJobId] = useState<string | undefined>(undefined);
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const getSourceJobId = () => sourceJobId;

  const { trigger, isMutating, error } = useAPIActiveJobUpdateDynamic(
    getSourceJobId,
    planId
  );

  useEffect(() => {
    if (sourceJobId) {
      trigger(
        { workerIds: workerIds },
        {
          onSuccess: () => {
            reloadJoblessWorkers();
          },
        }
      );
      setSourceJobId(undefined);
    }
  }, [sourceJobId, workerIds, trigger, reloadJoblessWorkers]);

  const onWorkerDropped = () => (e: React.DragEvent<HTMLTableRowElement>) => {
    const workerId = e.dataTransfer.getData("worker-id");
    const fromJobId = e.dataTransfer.getData("source-id");
    if (fromJobId === "jobless") {
      return;
    }

    const job = jobs.find((j) => j.id === fromJobId);

    if (!job) {
      return;
    }
    const newWorkers = [
      ...job.workers.map((w) => w.id).filter((w) => w !== workerId),
    ];

    setSourceJobId(fromJobId);
    setWorkerIds(newWorkers);
  };
  return (
    <>
      <ExpandableRow
        data={[`Bez práce (${joblessWorkers.length})`]}
        colspan={numColumns}
        className={joblessWorkers.length > 0 ? "smj-background-error" : ""}
        onDrop={onWorkerDropped()}
      >
        <div className="ms-2">
          <b>Následující pracovníci nemají přiřazenou práci:</b>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <tbody>
              {joblessWorkers.map((worker) => (
                <SimpleRow
                  data={formatWorkerData(worker)}
                  key={worker.id}
                  draggable={true}
                  onDragStart={onWorkerDragStart(worker, "jobless")}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ExpandableRow>
    </>
  );
}

function formatWorkerData(worker: WorkerComplete) {
  let name = `${worker.firstName} ${worker.lastName}`;
  const abilities = [];

  if (worker.cars.length > 0) abilities.push("Auto");
  if (worker.isStrong) abilities.push("Silák");
  const allergies = translateAllergies(worker.allergies);

  return [
    name,
    worker.phone,
    abilities.join(", "),
    allergies.map((a) => a.code).join(", "),
    <>
      <a className="me-3" href="#">
        Odstranit
      </a>
      <a href="#">Přesunout</a>
    </>,
  ];
}
