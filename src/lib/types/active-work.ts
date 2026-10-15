// Shared response type for GET /api/v1/me/active-work. Import from client components as well.
// Declared with `type` (not `interface`) so it stays assignable to ok()'s Record<string, unknown>.

export type ActiveWorkStage = 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export type ActiveWorkItem = {
  application_id: string;
  job_id: string;
  title: string;
  locality: string | null;
  wage: number;
  job_date: string;
  start_time: string;
  end_time: string;
  stage: ActiveWorkStage;
  my_role: 'WORKER' | 'BUSINESS';
  counterpart: {
    id: string;
    name: string;
    phone: string;
  };
  /** Arrival OTP the customer reads out to the worker. Business only, while ACCEPTED; otherwise null. */
  arrival_code: string | null;
  i_confirmed: boolean;
  other_confirmed: boolean;
  payment_confirmed: boolean;
  i_reviewed: boolean;
};
