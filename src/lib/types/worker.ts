// Worker-facing response shapes for GET /api/v1/jobs/nearby and GET /api/v1/worker/applications.
// Keys are snake_case to match the API contract. Imported by client components, so keep it free of server code.

import type { ApplicationStatus, JobStatus } from '@/lib/status';

export interface NearbyJobBusiness {
  id: string;
  business_name: string;
  business_type: string;
  locality: string;
  rating: number;
  rating_count: number;
  jobs_completed: number;
}

export interface NearbyJob {
  id: string;
  title: string;
  description: string;
  skill_id: string;
  skill_name: string;
  skill_slug: string;
  wage: number;
  food_provided: boolean;
  job_date: string;
  start_time: string;
  end_time: string;
  locality: string;
  latitude: number;
  longitude: number;
  workers_required: number;
  workers_accepted: number;
  distance_km: number;
  /** True when the business invited this worker directly. */
  is_invited: boolean;
  business: NearbyJobBusiness;
  /** The caller's application on this job, if any. */
  my_application_status: ApplicationStatus | null;
  application_id: string | null;
}

export interface WorkerApplicationBusiness {
  id: string;
  business_name: string;
  business_type: string;
  locality: string;
  /** Only populated while the application is matched (ACCEPTED / IN_PROGRESS / COMPLETED). */
  phone: string | null;
  /** Only populated while the application is matched. */
  owner_name: string | null;
}

export interface WorkerApplicationJob {
  id: string;
  title: string;
  description: string;
  skill_name: string;
  wage: number;
  food_provided: boolean;
  job_date: string;
  start_time: string;
  end_time: string;
  locality: string;
  status: JobStatus;
  business: WorkerApplicationBusiness;
}

export interface WorkerApplication {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  started_at: string | null;
  worker_confirmed: boolean;
  business_confirmed: boolean;
  completed_at: string | null;
  job: WorkerApplicationJob;
}
