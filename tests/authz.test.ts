import { describe, expect, it } from 'vitest';
import { GET as listBusinessJobs, POST as createJob } from '@/app/api/v1/business/jobs/route';
import { GET as applicants } from '@/app/api/v1/business/jobs/[id]/applicants/route';
import { POST as accept } from '@/app/api/v1/applications/[id]/accept/route';
import { GET as arrivalCode } from '@/app/api/v1/applications/[id]/arrival-code/route';
import { POST as start } from '@/app/api/v1/applications/[id]/start/route';
import { POST as confirmCompletion } from '@/app/api/v1/applications/[id]/confirm-completion/route';
import { POST as confirmPayment } from '@/app/api/v1/applications/[id]/confirm-payment/route';
import { POST as apply } from '@/app/api/v1/jobs/[id]/apply/route';
import { POST as withdraw } from '@/app/api/v1/jobs/[id]/withdraw/route';
import { POST as postReview } from '@/app/api/v1/reviews/route';
import { GET as getWorkerProfile, PUT as putWorkerProfile } from '@/app/api/v1/worker/profile/route';
import { PUT as putAvailability } from '@/app/api/v1/worker/availability/route';
import { GET as workerApplications } from '@/app/api/v1/worker/applications/route';
import { GET as activeWork } from '@/app/api/v1/me/active-work/route';
import { GET as nearbyWorkers } from '@/app/api/v1/workers/nearby/route';
import { GET as nearbyJobs } from '@/app/api/v1/jobs/nearby/route';
import { prisma } from '@/lib/prisma';
import {
  BASE_LAT,
  BASE_LNG,
  clearSession,
  ctx,
  jsonRequest,
  makeApplication,
  makeBusiness,
  makeJob,
  makeSkill,
  makeWorker,
  readBody,
  setSessionFor,
} from './helpers';

const NO_SESSION_CASES: Array<[string, () => Promise<Response>]> = [
  ['GET business/jobs', () => listBusinessJobs()],
  ['POST business/jobs', () => createJob(jsonRequest('POST', '/api/v1/business/jobs', {}))],
  ['GET applicants', () => applicants(jsonRequest('GET', '/x'), ctx('job-id'))],
  ['POST accept', () => accept(jsonRequest('POST', '/x'), ctx('app-id'))],
  ['POST apply', () => apply(jsonRequest('POST', '/x'), ctx('job-id'))],
  ['POST withdraw', () => withdraw(jsonRequest('POST', '/x'), ctx('job-id'))],
  ['GET arrival-code', () => arrivalCode(jsonRequest('GET', '/x'), ctx('app-id'))],
  ['POST start', () => start(jsonRequest('POST', '/x', { otp: '1234' }), ctx('app-id'))],
  ['POST confirm-completion', () => confirmCompletion(jsonRequest('POST', '/x'), ctx('app-id'))],
  ['POST confirm-payment', () => confirmPayment(jsonRequest('POST', '/x'), ctx('app-id'))],
  ['POST reviews', () => postReview(jsonRequest('POST', '/api/v1/reviews', {}))],
  ['GET worker/profile', () => getWorkerProfile()],
  ['PUT worker/profile', () => putWorkerProfile(jsonRequest('PUT', '/x', {}))],
  ['PUT worker/availability', () => putAvailability(jsonRequest('PUT', '/x', { availability: 'UNAVAILABLE' }))],
  ['GET worker/applications', () => workerApplications()],
  ['GET me/active-work', () => activeWork()],
];

describe('protected routes without a session return 401', () => {
  it.each(NO_SESSION_CASES)('%s', async (_name, call) => {
    clearSession();
    const res = await call();
    expect(res.status).toBe(401);
    const body = await readBody(res);
    expect(body.success).toBe(false);
    expect(body.code).toBe('UNAUTHENTICATED');
  });
});

describe('ownership and role checks', () => {
  async function setupAcceptedJob() {
    const skill = await makeSkill('helper');
    const owner = await makeBusiness({ name: 'Owner' });
    const job = await makeJob(owner.id, skill.id, { workersRequired: 1 });
    const worker = await makeWorker({ name: 'Worker One', phone: '9111111111' });
    const application = await makeApplication(job.id, worker.id, 'ACCEPTED', { arrivalOtp: '4321' });
    return { skill, owner, job, worker, application };
  }

  it("another business cannot read applicants of someone else's job", async () => {
    const { job } = await setupAcceptedJob();
    const intruder = await makeBusiness({ name: 'Intruder' });
    await setSessionFor(intruder.id);

    const res = await applicants(jsonRequest('GET', `/api/v1/business/jobs/${job.id}/applicants`), ctx(job.id));
    expect(res.status).toBe(403);
  });

  it("another business cannot accept an application on someone else's job", async () => {
    const skill = await makeSkill('cleaner');
    const owner = await makeBusiness();
    const job = await makeJob(owner.id, skill.id, { workersRequired: 2 });
    const worker = await makeWorker();
    const application = await makeApplication(job.id, worker.id, 'APPLIED');

    const intruder = await makeBusiness();
    await setSessionFor(intruder.id);
    const res = await accept(jsonRequest('POST', '/x'), ctx(application.id));
    expect(res.status).toBe(403);

    const unchanged = await prisma.application.findUniqueOrThrow({ where: { id: application.id } });
    expect(unchanged.status).toBe('APPLIED');
  });

  it("another business cannot read the arrival code of someone else's application", async () => {
    const { application } = await setupAcceptedJob();
    const intruder = await makeBusiness();
    await setSessionFor(intruder.id);

    const res = await arrivalCode(jsonRequest('GET', '/x'), ctx(application.id));
    expect(res.status).toBe(403);
    expect(JSON.stringify(await readBody(res))).not.toContain('4321');
  });

  it('the owning business can read the arrival code', async () => {
    const { owner, application } = await setupAcceptedJob();
    await setSessionFor(owner.id);
    const res = await arrivalCode(jsonRequest('GET', '/x'), ctx(application.id));
    expect(res.status).toBe(200);
    expect((await readBody(res)).code).toBe('4321');
  });

  it('a worker cannot accept applications', async () => {
    const { worker, application } = await setupAcceptedJob();
    await setSessionFor(worker.id);
    const res = await accept(jsonRequest('POST', '/x'), ctx(application.id));
    expect(res.status).toBe(403);
  });

  it('a business cannot apply to a job as a worker', async () => {
    const { job } = await setupAcceptedJob();
    const business = await makeBusiness();
    await setSessionFor(business.id);
    const res = await apply(jsonRequest('POST', '/x'), ctx(job.id));
    expect(res.status).toBe(403);
  });

  it('a non-party cannot confirm completion', async () => {
    const { application } = await setupAcceptedJob();
    const outsider = await makeWorker({ phone: '9122222222' });
    await setSessionFor(outsider.id);
    const res = await confirmCompletion(jsonRequest('POST', '/x'), ctx(application.id));
    expect(res.status).toBe(403);
  });

  it('a non-party cannot review a job', async () => {
    const { application } = await setupAcceptedJob();
    await prisma.application.update({ where: { id: application.id }, data: { status: 'COMPLETED' } });
    const outsider = await makeWorker({ phone: '9133333333' });
    await setSessionFor(outsider.id);
    const res = await postReview(jsonRequest('POST', '/api/v1/reviews', { application_id: application.id, rating: 1 }));
    expect(res.status).toBe(403);
  });

  it("a worker cannot start work on someone else's application", async () => {
    const { application } = await setupAcceptedJob();
    const other = await makeWorker({ phone: '9144444444' });
    await setSessionFor(other.id);
    const res = await start(jsonRequest('POST', '/x', { otp: '4321' }), ctx(application.id));
    expect(res.status).toBe(403);
  });

  it('a worker cannot confirm payment', async () => {
    const { application, worker } = await setupAcceptedJob();
    await prisma.application.update({ where: { id: application.id }, data: { status: 'COMPLETED' } });
    await setSessionFor(worker.id);
    const res = await confirmPayment(jsonRequest('POST', '/x'), ctx(application.id));
    expect(res.status).toBe(403);
  });

  it('a worker cannot use the business job list', async () => {
    const worker = await makeWorker();
    await setSessionFor(worker.id);
    const res = await listBusinessJobs();
    expect(res.status).toBe(403);
  });

  it('workers/nearby never exposes a phone number', async () => {
    const skill = await makeSkill('plumber');
    const worker = await makeWorker({ phone: '9876501234', name: 'Phone Hider', skillIds: [skill.id] });
    await makeWorker({ phone: '9812309876', latitude: BASE_LAT + 0.01, longitude: BASE_LNG });
    const viewer = await makeBusiness();
    await setSessionFor(viewer.id);

    const res = await nearbyWorkers(
      jsonRequest('GET', `/api/v1/workers/nearby?lat=${BASE_LAT}&lng=${BASE_LNG}&max_distance=10`)
    );
    expect(res.status).toBe(200);
    const body = await readBody(res);
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('9876501234');
    expect(raw).not.toContain('9812309876');
    expect(raw).not.toMatch(/"phone"/);
    expect(body.workers.map((w: { id: string }) => w.id)).toContain(worker.id);
  });

  it('workers/nearby excludes the caller and inactive workers', async () => {
    const me = await makeWorker({ phone: '9811111111', name: 'Me' });
    const inactive = await makeWorker({ phone: '9822222222', isActive: false });
    const other = await makeWorker({ phone: '9833333333' });
    await setSessionFor(me.id);

    const body = await readBody(
      await nearbyWorkers(jsonRequest('GET', `/api/v1/workers/nearby?lat=${BASE_LAT}&lng=${BASE_LNG}`))
    );
    const ids = body.workers.map((w: { id: string }) => w.id);
    expect(ids).toContain(other.id);
    expect(ids).not.toContain(me.id);
    expect(ids).not.toContain(inactive.id);
  });

  it("jobs/nearby hides the caller's own jobs", async () => {
    const skill = await makeSkill('cleaner');
    const business = await makeBusiness();
    await makeJob(business.id, skill.id, { title: 'Own job' });
    await setSessionFor(business.id);
    const body = await readBody(
      await nearbyJobs(jsonRequest('GET', `/api/v1/jobs/nearby?lat=${BASE_LAT}&lng=${BASE_LNG}`))
    );
    expect(body.jobs.map((j: { title: string }) => j.title)).not.toContain('Own job');
  });

  it('worker profile update rejects unknown skill ids', async () => {
    const worker = await makeWorker();
    await setSessionFor(worker.id);
    const res = await putWorkerProfile(jsonRequest('PUT', '/x', { skill_ids: ['does-not-exist'] }));
    expect(res.status).toBe(400);
  });

  it('a logged-in worker can read their own profile', async () => {
    const skill = await makeSkill('painter');
    const worker = await makeWorker({ skillIds: [skill.id], name: 'Painter Pat' });
    await setSessionFor(worker.id);
    const res = await getWorkerProfile();
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.worker.name).toBe('Painter Pat');
    expect(body.worker.skills.map((s: { slug: string }) => s.slug)).toEqual(['painter']);
  });
});
