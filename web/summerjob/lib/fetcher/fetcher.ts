import { ApiError } from "lib/data/apiError";
import { Allergy } from "lib/prisma/client";
import { PlanComplete, PlanWithJobs } from "lib/types/plan";
import { WorkerComplete } from "lib/types/worker";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const get = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json();
    if (data.error && data.error.type && data.error.message) {
      throw new ApiError(data.error.message, data.error.type);
    }
    throw new Error("An error occurred while fetching the data.");
  }

  return res.json();
};

const patch = async (url: string, { arg }: { arg: any }) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const data = await res.json();
    if (data.error && data.error.type && data.error.message) {
      throw new ApiError(data.error.message, data.error.type);
    }
    throw new Error("An error occurred while submitting the data.");
  }
  if (res.status === 204) {
    return;
  }
  return res.json();
};

function useData<T, E>(url: string) {
  return useSWR<T, E>(url, get);
}

function useDataPartialUpdate(url: string, options?: any) {
  return useSWRMutation(url, patch, options);
}

export function useAPIWorkerUpdate(workerId: string, options?: any) {
  return useDataPartialUpdate(`/api/users/${workerId}`, options);
}

export function useAPIWorkers() {
  return useData<WorkerComplete[], Error>("/api/users");
}

export function useAPIWorker(id: string) {
  return useData<WorkerComplete, Error>(`/api/users/${id}`);
}

export function useAPIPlans() {
  const properties = useData<PlanWithJobs[], Error>("/api/plans");
  if (properties.data) {
    for (const plan of properties.data) {
      plan.day = new Date(plan.day);
    }
  }
  return properties;
}

export function useAPIPlan(id: string) {
  const properties = useData<PlanComplete, Error>(`/api/plans/${id}`);
  if (properties.data) {
    properties.data.day = new Date(properties.data.day);
  }
  return properties;
}

export function useAPIAllergies() {
  return useData<Allergy[], Error>("/api/allergies");
}
