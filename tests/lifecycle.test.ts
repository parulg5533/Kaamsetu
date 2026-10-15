import { describe, expect, it } from 'vitest';
import { POST as createJob, GET as listBusinessJobs } from '@/app/api/v1/business/jobs/route';
import { POST as accept } from '@/app/api/v1/applications/[id]/accept/route';
import { GET as arrivalCode } from '@/app/api/v1/applications/[id]/arrival-code/route';
import { POST as start } from '@/app/api/v1/applications/[id]/start/route';
import { POST as confirmCompletion } from '@/app/api/v1/applications/[id]/confirm-completion/route';
import { POST as confirmPayment } from '@/app/api/v1/applications/[id]/confirm-payment/route';
import { POST as apply } from '@/app/api/v1/jobs/[id]/apply/route';
import { POST as withdraw } from '@/app/api/v1/jobs/[id]/withdraw/route';
import { POST as postReview } from '@/app/api/v1/reviews/route';
import { GET as nearbyJobs } from '@/app/api/v1/jobs/nearby/route';
import { GET as workerApplications } from '@/app/api/v1/worker/applications/route';
import { GET as activeWork } from '@/app/api/v1/me/active-work/route';
import { prisma } from '@/lib/prisma';
import {
  BASE_LAT,
  BASE_LNG,
  ctx,
  jsonRequest,
  makeBusiness,
  makeJob,
  makeSkill,
  makeWorker,
  readBody,
  setSessionFor,
} from './helpers';

const JOB_DATE = '2026-12-01';

function jobBody(skillId: string, overrides: Record<string, unknown> = {}) {
  return {
    skill_id: skillId,
    title: 'Loading and unloading',
    description: 'Truck unload at godown',
    workers_required: 1,
    wage: 700,
    food_provided: 'false',
    job_date: JOB_DATE,
    start_time: '09:00',
    end_time: '17:00',
    locality: 'Lawrence Road, Amritsar',
    latitude: BASE_LAT,
    longitude: BASE_LNG,
    ...overrides,
  };
}

async function asUser(userId: string) {
  await setSessionFor(userId);
}

async function applyAs(workerId: string, jobId: string) {
  await asUser(workerId);
  return apply(jsonRequest('POST', `/api/v1/jobs/${jobId}/apply`), ctx(jobId));
}

async function acceptAs(businessId: string, applicationId: string) {
  await asUser(businessId);
  return accept(jsonRequest('POST', `/api/v1/applications/${applicationId}/accept`), ctx(applicationId));
}

async function arrivalCodeAs(businessId: string, applicationId: string): Promise<string> {
  await asUser(businessId);
  const res = await arrivalCode(jsonRequest('GET', '/x'), ctx(applicationId));
  expect(res.status).toBe(200);
  return (await readBody(res)).code;
}

describe('job lifecycle (single-slot job)', () => {
  it('runs from posting through payment with server-enforced transitions', async () => {
    const skill = await makeSkill('helper');
    const business = await makeBusiness({ name: 'Kirana Owner' });
    const workerA = await makeWorker({ name: 'Worker A', phone: '9500000001' });
    const workerB = await makeWorker({ name: 'Worker B', phone: '9500000002' });

    // 1. Post the job.
    await asUser(business.id);
    const postRes = await createJob(jsonRequest('POST', '/api/v1/business/jobs', jobBody(skill.id)));
    expect(postRes.status).toBe(201);
    const jobId: string = (await readBody(postRes)).job.id;
    expect(jobId).toBeTruthy();

    // 2. Two workers apply.
    const applyARes = await applyAs(workerA.id, jobId);
    expect(applyARes.status).toBe(200);
    const applyA = await readBody(applyARes);
    expect(applyA.auto_accepted).toBe(false);
    expect(applyA.application.status).toBe('APPLIED');
    expect(JSON.stringify(applyA)).not.toMatch(/"arrivalOtp"\s*:/);
    const appA: string = applyA.application.id;

    const applyBRes = await applyAs(workerB.id, jobId);
    expect(applyBRes.status).toBe(200);
    const appB: string = (await readBody(applyBRes)).application.id;

    // 3. Duplicate apply is rejected.
    const dupRes = await applyAs(workerA.id, jobId);
    expect(dupRes.status).toBe(409);
    expect((await readBody(dupRes)).code).toBe('ALREADY_APPLIED');

    // 4. Business accepts A; the single slot fills and B is rejected automatically.
    const acceptARes = await acceptAs(business.id, appA);
    expect(acceptARes.status).toBe(200);
    const acceptA = await readBody(acceptARes);
    expect(acceptA.application.status).toBe('ACCEPTED');
    expect(acceptA.job_status).toBe('FILLED');
    expect(acceptA.worker).toMatchObject({ id: workerA.id, name: 'Worker A' });
    expect(JSON.stringify(acceptA.application)).not.toMatch(/"arrivalOtp"\s*:/);

    // 5. Accepting A again is a conflict.
    const reAccept = await acceptAs(business.id, appA);
    expect(reAccept.status).toBe(409);
    expect((await readBody(reAccept)).code).toBe('NOT_PENDING');

    // 6. Accepting B (now REJECTED) is a conflict and B stays rejected.
    const acceptBRes = await acceptAs(business.id, appB);
    expect(acceptBRes.status).toBe(409);
    const appBRow = await prisma.application.findUniqueOrThrow({ where: { id: appB } });
    expect(appBRow.status).toBe('REJECTED');
    const jobRow = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(jobRow.status).toBe('FILLED');
    expect(jobRow.workersAccepted).toBe(1);

    // 7. The accepted worker cannot re-apply, and the status is unchanged.
    const reapplyRes = await applyAs(workerA.id, jobId);
    expect(reapplyRes.status).toBe(409);
    const appARow = await prisma.application.findUniqueOrThrow({ where: { id: appA } });
    expect(appARow.status).toBe('ACCEPTED');

    // 8. Completing before starting is rejected.
    await asUser(business.id);
    const earlyComplete = await confirmCompletion(jsonRequest('POST', '/x'), ctx(appA));
    expect(earlyComplete.status).toBe(409);

    // 9. Wrong arrival code is rejected; the right code (read by the business) starts the work.
    const code = await arrivalCodeAs(business.id, appA);
    expect(code).toMatch(/^\d{4}$/);
    const wrong = code === '0000' ? '1111' : '0000';

    await asUser(workerA.id);
    const wrongRes = await start(jsonRequest('POST', `/x`, { otp: wrong }), ctx(appA));
    expect(wrongRes.status).toBe(400);
    expect((await readBody(wrongRes)).code).toBe('WRONG_CODE');

    const startRes = await start(jsonRequest('POST', `/x`, { otp: code }), ctx(appA));
    expect(startRes.status).toBe(200);
    const started = await readBody(startRes);
    expect(started.application.status).toBe('IN_PROGRESS');
    expect(JSON.stringify(started)).not.toMatch(/"arrivalOtp"\s*:/);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: jobId } })).status).toBe('IN_PROGRESS');

    // The arrival code is single-use: the business can no longer read it.
    await asUser(business.id);
    const codeAfterStart = await arrivalCode(jsonRequest('GET', '/x'), ctx(appA));
    expect(codeAfterStart.status).toBe(409);

    // 10. Reviews are not allowed until the work is completed.
    const earlyReview = await postReview(
      jsonRequest('POST', '/api/v1/reviews', { application_id: appA, rating: 4, feedback_tag: 'PUNCTUAL' })
    );
    expect(earlyReview.status).toBe(409);

    // 11. Worker confirms: waiting on the business.
    await asUser(workerA.id);
    const workerConfirm = await confirmCompletion(jsonRequest('POST', '/x'), ctx(appA));
    expect(workerConfirm.status).toBe(200);
    const wc = await readBody(workerConfirm);
    expect(wc).toMatchObject({ completed: false, waiting_for: 'BUSINESS' });

    // 12. Worker confirms again: no change.
    const workerConfirmAgain = await confirmCompletion(jsonRequest('POST', '/x'), ctx(appA));
    expect(await readBody(workerConfirmAgain)).toMatchObject({ completed: false, waiting_for: 'BUSINESS' });

    // 13. Business confirms: completed.
    await asUser(business.id);
    const bizConfirm = await confirmCompletion(jsonRequest('POST', '/x'), ctx(appA));
    expect(bizConfirm.status).toBe(200);
    expect(await readBody(bizConfirm)).toMatchObject({ completed: true, waiting_for: null });

    const afterComplete = await prisma.application.findUniqueOrThrow({ where: { id: appA } });
    expect(afterComplete.status).toBe('COMPLETED');
    expect(afterComplete.completedAt).not.toBeNull();
    expect((await prisma.job.findUniqueOrThrow({ where: { id: jobId } })).status).toBe('COMPLETED');
    expect((await prisma.workerProfile.findUniqueOrThrow({ where: { userId: workerA.id } })).jobsCompleted).toBe(1);
    expect((await prisma.business.findUniqueOrThrow({ where: { userId: business.id } })).jobsCompleted).toBe(1);

    // 14. Business confirms again: idempotent, counters unchanged.
    const bizConfirmAgain = await confirmCompletion(jsonRequest('POST', '/x'), ctx(appA));
    expect(bizConfirmAgain.status).toBe(200);
    expect(await readBody(bizConfirmAgain)).toMatchObject({ completed: true });
    expect((await prisma.workerProfile.findUniqueOrThrow({ where: { userId: workerA.id } })).jobsCompleted).toBe(1);
    expect((await prisma.business.findUniqueOrThrow({ where: { userId: business.id } })).jobsCompleted).toBe(1);

    // 15. Payment confirmation (idempotent).
    const pay1 = await confirmPayment(jsonRequest('POST', '/x'), ctx(appA));
    expect(pay1.status).toBe(200);
    const pay2 = await confirmPayment(jsonRequest('POST', '/x'), ctx(appA));
    expect(pay2.status).toBe(200);
    expect((await prisma.application.findUniqueOrThrow({ where: { id: appA } })).paymentConfirmedAt).not.toBeNull();

    // 16. Reviews after completion: rating is recomputed from Review rows.
    await asUser(workerA.id);
    const workerReview = await postReview(
      jsonRequest('POST', '/api/v1/reviews', {
        application_id: appA,
        rating: 4,
        feedback_tag: 'PAID_ON_TIME',
        comment: 'Paid on time',
      })
    );
    expect(workerReview.status).toBe(200);
    expect((await readBody(workerReview)).new_rating).toBe(4);
    expect((await prisma.business.findUniqueOrThrow({ where: { userId: business.id } })).rating).toBe(4);

    // Business reviews the worker. A second, earlier review from another customer averages in.
    const otherBusiness = await makeBusiness({ name: 'Other Customer', phone: '9500000009' });
    const otherJob = await makeJob(otherBusiness.id, skill.id);
    await prisma.review.create({
      data: { jobId: otherJob.id, fromUserId: otherBusiness.id, toUserId: workerA.id, rating: 3 },
    });
    await asUser(business.id);
    const bizReview = await postReview(
      jsonRequest('POST', '/api/v1/reviews', { application_id: appA, rating: 5, feedback_tag: 'HARDWORKING' })
    );
    expect(bizReview.status).toBe(200);
    expect((await readBody(bizReview)).new_rating).toBe(4);
    const workerProfile = await prisma.workerProfile.findUniqueOrThrow({ where: { userId: workerA.id } });
    expect(workerProfile.rating).toBe(4);
    expect(workerProfile.ratingCount).toBe(2);

    // Re-reviewing the same counterpart upserts rather than duplicating.
    await asUser(workerA.id);
    const reReview = await postReview(jsonRequest('POST', '/api/v1/reviews', { application_id: appA, rating: 2 }));
    expect(reReview.status).toBe(200);
    expect((await readBody(reReview)).new_rating).toBe(2);
    expect(await prisma.review.count({ where: { jobId, fromUserId: workerA.id, toUserId: business.id } })).toBe(1);
    expect((await prisma.business.findUniqueOrThrow({ where: { userId: business.id } })).rating).toBe(2);

    // Completed work leaves the active-work list once the parties have reviewed (worker side).
    await asUser(workerA.id);
    const workerActive = await readBody(await activeWork());
    expect(workerActive.items.map((i: { application_id: string }) => i.application_id)).not.toContain(appA);
    const apps = await readBody(await workerApplications());
    expect(apps.applications.find((a: { id: string }) => a.id === appA).status).toBe('COMPLETED');
  });

  it('auto-accepts an invited worker on apply and hides the job from other workers', async () => {
    const skill = await makeSkill('cleaner');
    const business = await makeBusiness();
    const invited = await makeWorker({ name: 'Invited', phone: '9500000011' });
    const other = await makeWorker({ name: 'Other', phone: '9500000012' });

    await asUser(business.id);
    const postRes = await createJob(
      jsonRequest('POST', '/api/v1/business/jobs', jobBody(skill.id, { title: 'Direct hire', invited_worker_id: invited.id }))
    );
    expect(postRes.status).toBe(201);
    const jobId: string = (await readBody(postRes)).job.id;

    // Hidden from other workers, visible to the invited worker with is_invited.
    await asUser(other.id);
    const otherView = await readBody(await nearbyJobs(jsonRequest('GET', `/api/v1/jobs/nearby?lat=${BASE_LAT}&lng=${BASE_LNG}`)));
    expect(otherView.jobs.map((j: { id: string }) => j.id)).not.toContain(jobId);

    await asUser(invited.id);
    const invitedView = await readBody(await nearbyJobs(jsonRequest('GET', `/api/v1/jobs/nearby?lat=${BASE_LAT}&lng=${BASE_LNG}`)));
    const listed = invitedView.jobs.find((j: { id: string }) => j.id === jobId);
    expect(listed).toBeDefined();
    expect(listed.is_invited).toBe(true);

    const applyRes = await applyAs(invited.id, jobId);
    expect(applyRes.status).toBe(200);
    const applied = await readBody(applyRes);
    expect(applied.auto_accepted).toBe(true);
    expect(applied.application.status).toBe('ACCEPTED');
    expect(JSON.stringify(applied)).not.toMatch(/"arrivalOtp"\s*:/);

    const jobRow = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(jobRow.status).toBe('FILLED');
    expect(jobRow.workersAccepted).toBe(1);
  });

  it('a non-invited worker cannot apply to a direct-hire job', async () => {
    const skill = await makeSkill('electrician');
    const business = await makeBusiness();
    const invited = await makeWorker({ phone: '9500000013' });
    const other = await makeWorker({ phone: '9500000014' });
    const job = await makeJob(business.id, skill.id, { invitedWorkerId: invited.id });

    const res = await applyAs(other.id, job.id);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await prisma.application.count({ where: { jobId: job.id, workerId: other.id } })).toBe(0);
  });

  it('withdraw then re-apply reopens the same application', async () => {
    const skill = await makeSkill('shop');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id, { workersRequired: 2 });
    const worker = await makeWorker({ phone: '9500000021' });

    const first = await readBody(await applyAs(worker.id, job.id));
    await asUser(worker.id);
    const withdrawRes = await withdraw(jsonRequest('POST', '/x'), ctx(job.id));
    expect(withdrawRes.status).toBe(200);
    expect((await readBody(withdrawRes)).application.status).toBe('WITHDRAWN');

    const reapply = await applyAs(worker.id, job.id);
    expect(reapply.status).toBe(200);
    const body = await readBody(reapply);
    expect(body.application.id).toBe(first.application.id);
    expect(body.application.status).toBe('APPLIED');
    expect(await prisma.application.count({ where: { jobId: job.id, workerId: worker.id } })).toBe(1);
  });

  it('a job with two slots accepts two workers, then becomes FILLED', async () => {
    const skill = await makeSkill('loader');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id, { workersRequired: 2 });
    const a = await makeWorker({ phone: '9500000031' });
    const b = await makeWorker({ phone: '9500000032' });
    const c = await makeWorker({ phone: '9500000033' });
    const appA = (await readBody(await applyAs(a.id, job.id))).application.id;
    const appB = (await readBody(await applyAs(b.id, job.id))).application.id;
    const appC = (await readBody(await applyAs(c.id, job.id))).application.id;

    expect((await acceptAs(business.id, appA)).status).toBe(200);
    const second = await acceptAs(business.id, appB);
    expect(second.status).toBe(200);
    expect((await readBody(second)).job_status).toBe('FILLED');
    expect((await prisma.application.findUniqueOrThrow({ where: { id: appC } })).status).toBe('REJECTED');
  });

  it('two concurrent accepts for a single slot: exactly one succeeds', async () => {
    const skill = await makeSkill('painter');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id, { workersRequired: 1 });
    const a = await makeWorker({ phone: '9500000041' });
    const b = await makeWorker({ phone: '9500000042' });
    const appA = (await readBody(await applyAs(a.id, job.id))).application.id;
    const appB = (await readBody(await applyAs(b.id, job.id))).application.id;

    await asUser(business.id);
    const results = await Promise.all([
      accept(jsonRequest('POST', '/x'), ctx(appA)),
      accept(jsonRequest('POST', '/x'), ctx(appB)),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);

    const jobRow = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(jobRow.workersAccepted).toBe(1);
    expect(jobRow.status).toBe('FILLED');
    const accepted = await prisma.application.count({ where: { jobId: job.id, status: 'ACCEPTED' } });
    expect(accepted).toBe(1);
  });

  it('locks the arrival code after 5 wrong attempts', async () => {
    const skill = await makeSkill('delivery');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id);
    const worker = await makeWorker({ phone: '9500000051' });
    const appId = (await readBody(await applyAs(worker.id, job.id))).application.id;
    await acceptAs(business.id, appId);
    const code = await arrivalCodeAs(business.id, appId);
    const wrong = code === '0000' ? '1111' : '0000';

    await asUser(worker.id);
    for (let i = 0; i < 5; i++) {
      const res = await start(jsonRequest('POST', '/x', { otp: wrong }), ctx(appId));
      expect(res.status).toBe(400);
    }
    const locked = await start(jsonRequest('POST', '/x', { otp: code }), ctx(appId));
    expect(locked.status).toBe(429);
    expect((await prisma.application.findUniqueOrThrow({ where: { id: appId } })).status).toBe('ACCEPTED');
  });

  it('an accepted application cannot be withdrawn', async () => {
    const skill = await makeSkill('cook');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id);
    const worker = await makeWorker({ phone: '9500000061' });
    const appId = (await readBody(await applyAs(worker.id, job.id))).application.id;
    await acceptAs(business.id, appId);

    await asUser(worker.id);
    const res = await withdraw(jsonRequest('POST', '/x'), ctx(job.id));
    expect(res.status).toBe(409);
    expect((await prisma.application.findUniqueOrThrow({ where: { id: appId } })).status).toBe('ACCEPTED');
  });

  it('business job list reports applicant and accepted counts', async () => {
    const skill = await makeSkill('shop');
    const business = await makeBusiness();
    const job = await makeJob(business.id, skill.id, { workersRequired: 2 });
    const a = await makeWorker({ phone: '9500000071' });
    const b = await makeWorker({ phone: '9500000072' });
    const appA = (await readBody(await applyAs(a.id, job.id))).application.id;
    await applyAs(b.id, job.id);
    await acceptAs(business.id, appA);

    await asUser(business.id);
    const list = await readBody(await listBusinessJobs());
    const row = list.jobs.find((j: { id: string }) => j.id === job.id);
    expect(row).toMatchObject({ applicant_count: 1, accepted_count: 1, workers_accepted: 1 });
  });
});
