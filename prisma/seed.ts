import { PrismaClient } from '@prisma/client';
import { addDaysISO, localISODate } from '../src/lib/date';
import { APPLICATION_STATUS, JOB_STATUS, MATCHED_STATUSES, type FeedbackTag } from '../src/lib/status';

const prisma = new PrismaClient();

/** Local Date at hh:mm on the day `dayOffset` days from today. */
function localDateTime(dayOffset: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute);
}

/** Timestamps for an application that ran to completion on the day `dayOffset`. */
function completedTimes(dayOffset: number) {
  return {
    appliedAt: localDateTime(dayOffset - 1, 18),
    startedAt: localDateTime(dayOffset, 10, 0),
    workerConfirmedAt: localDateTime(dayOffset, 19, 0),
    businessConfirmedAt: localDateTime(dayOffset, 19, 5),
    completedAt: localDateTime(dayOffset, 19, 5),
    paymentConfirmedAt: localDateTime(dayOffset, 20, 0),
  };
}

/** Creates one review row. Ratings on profiles are recomputed from these at the end. */
async function review(
  jobId: string,
  fromUserId: string,
  toUserId: string,
  rating: number,
  feedbackTag: FeedbackTag,
  comment: string
) {
  await prisma.review.create({ data: { jobId, fromUserId, toUserId, rating, feedbackTag, comment } });
}

/** Rounds an average to 1 decimal; no reviews means 0. */
function roundRating(avg: number | null): number {
  return avg === null ? 0 : Math.round(avg * 10) / 10;
}

async function main() {
  console.log('Seeding KaamSetu database...');

  // Clean existing records in correct relation order (children before parents)
  await prisma.review.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.workerSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Skills (slug is the stable key used by the client)
  const sRestaurant = await prisma.skill.create({
    data: { name: 'Restaurant Helper', slug: 'hospitality', category: 'HOSPITALITY', iconName: 'utensils' }
  });
  const sShop = await prisma.skill.create({
    data: { name: 'Shop Helper', slug: 'shop', category: 'RETAIL', iconName: 'store' }
  });
  const sLoading = await prisma.skill.create({
    data: { name: 'Loading / Unloading', slug: 'helper', category: 'LOGISTICS', iconName: 'package' }
  });
  const sDelivery = await prisma.skill.create({
    data: { name: 'Delivery Helper', slug: 'delivery', category: 'LOGISTICS', iconName: 'truck' }
  });
  const sCleaner = await prisma.skill.create({
    data: { name: 'Cleaner & Housekeeping', slug: 'cleaner', category: 'HOSPITALITY', iconName: 'sparkles' }
  });
  const sConstruction = await prisma.skill.create({
    data: { name: 'General Construction Helper', slug: 'construction', category: 'MANUAL', iconName: 'hammer' }
  });
  const sElectrician = await prisma.skill.create({
    data: { name: 'Electrician & Wiring', slug: 'electrician', category: 'TECHNICAL', iconName: 'zap' }
  });
  const sPlumber = await prisma.skill.create({
    data: { name: 'Plumber & Pipe Fitting', slug: 'plumber', category: 'TECHNICAL', iconName: 'wrench' }
  });
  await prisma.skill.create({
    data: { name: 'Carpenter & Woodwork', slug: 'carpenter', category: 'MANUAL', iconName: 'hammer' }
  });
  await prisma.skill.create({
    data: { name: 'Painter & Whitewash', slug: 'painter', category: 'MANUAL', iconName: 'paint-brush' }
  });
  await prisma.skill.create({
    data: { name: 'General Helper', slug: 'general', category: 'GENERAL', iconName: 'briefcase' }
  });

  // Ratings and job counters start at zero and are reconciled from real rows at the end of the seed.

  // 2. Seed Businesses
  // Business 1: Sharma Restaurant
  const uSharma = await prisma.user.create({
    data: { phone: '9812345678', name: 'Sharma Ji', role: 'BUSINESS' }
  });
  const bSharma = await prisma.business.create({
    data: {
      userId: uSharma.id,
      businessName: 'Sharma Restaurant',
      businessType: 'Restaurant & Dhaba',
      address: 'Shop 14, Lawrence Road, near Novelty Sweets',
      city: 'Amritsar',
      locality: 'Lawrence Road',
      latitude: 31.6375,
      longitude: 74.8780,
      rating: 0,
      ratingCount: 0,
      jobsPosted: 0,
      jobsCompleted: 0
    }
  });

  // Business 2: Verma Kirana Store
  const uVerma = await prisma.user.create({
    data: { phone: '9812345679', name: 'Rajesh Verma', role: 'BUSINESS' }
  });
  const bVerma = await prisma.business.create({
    data: {
      userId: uVerma.id,
      businessName: 'Verma Kirana Store',
      businessType: 'Retail Grocery Store',
      address: '22 Hall Bazaar, Chowk Phowara',
      city: 'Amritsar',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      rating: 0,
      ratingCount: 0,
      jobsPosted: 0,
      jobsCompleted: 0
    }
  });

  // Business 3: Punjab Logistics Hub
  const uPunjab = await prisma.user.create({
    data: { phone: '9812345680', name: 'Harpreet Singh', role: 'BUSINESS' }
  });
  const bPunjab = await prisma.business.create({
    data: {
      userId: uPunjab.id,
      businessName: 'Punjab Logistics Hub',
      businessType: 'Transport & Godown',
      address: 'Plot 4A, GT Road Industrial Area',
      city: 'Amritsar',
      locality: 'GT Road',
      latitude: 31.6250,
      longitude: 74.8650,
      rating: 0,
      ratingCount: 0,
      jobsPosted: 0,
      jobsCompleted: 0
    }
  });

  // 3. Seed Workers
  // Worker 1: Rahul Kumar
  const uRahul = await prisma.user.create({
    data: { phone: '9876543210', name: 'Rahul Kumar', role: 'WORKER' }
  });
  const wRahul = await prisma.workerProfile.create({
    data: {
      userId: uRahul.id,
      city: 'Amritsar',
      locality: 'Ranjit Avenue',
      latitude: 31.6340,
      longitude: 74.8723,
      experienceYears: 2.0,
      expectedWage: 600,
      availability: 'AVAILABLE_TODAY',
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wRahul.userId, skillId: sRestaurant.id },
      { workerId: wRahul.userId, skillId: sShop.id }
    ]
  });

  // Worker 2: Aman Singh
  const uAman = await prisma.user.create({
    data: { phone: '9876543211', name: 'Aman Singh', role: 'WORKER' }
  });
  const wAman = await prisma.workerProfile.create({
    data: {
      userId: uAman.id,
      city: 'Amritsar',
      locality: 'Mall Road',
      latitude: 31.6420,
      longitude: 74.8750,
      experienceYears: 1.5,
      expectedWage: 650,
      availability: 'AVAILABLE_TODAY',
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wAman.userId, skillId: sLoading.id },
      { workerId: wAman.userId, skillId: sDelivery.id }
    ]
  });

  // Worker 3: Gurpreet Kaur
  const uGurpreet = await prisma.user.create({
    data: { phone: '9876543212', name: 'Gurpreet Kaur', role: 'WORKER' }
  });
  const wGurpreet = await prisma.workerProfile.create({
    data: {
      userId: uGurpreet.id,
      city: 'Amritsar',
      locality: 'Majitha Road',
      latitude: 31.6450,
      longitude: 74.8690,
      experienceYears: 3.0,
      expectedWage: 550,
      availability: 'AVAILABLE_TOMORROW',
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wGurpreet.userId, skillId: sCleaner.id },
      { workerId: wGurpreet.userId, skillId: sShop.id }
    ]
  });

  // Worker 4: Ramesh Mistri (Electrician)
  const uRamesh = await prisma.user.create({
    data: { phone: '9876543213', name: 'Ramesh Mistri', role: 'WORKER' }
  });
  const wRamesh = await prisma.workerProfile.create({
    data: {
      userId: uRamesh.id,
      city: 'Amritsar',
      locality: 'Putligarh',
      latitude: 31.6380,
      longitude: 74.8550,
      experienceYears: 5.0,
      expectedWage: 750,
      availability: 'AVAILABLE_TODAY',
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0
    }
  });
  await prisma.workerSkill.createMany({
    data: [{ workerId: wRamesh.userId, skillId: sElectrician.id }]
  });

  // Worker 5: Jagjit Singh (Plumber)
  const uJagjit = await prisma.user.create({
    data: { phone: '9876543214', name: 'Jagjit Singh', role: 'WORKER' }
  });
  const wJagjit = await prisma.workerProfile.create({
    data: {
      userId: uJagjit.id,
      city: 'Amritsar',
      locality: 'Chheharta',
      latitude: 31.6280,
      longitude: 74.8390,
      experienceYears: 4.0,
      expectedWage: 700,
      availability: 'AVAILABLE_TODAY',
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wJagjit.userId, skillId: sPlumber.id },
      { workerId: wJagjit.userId, skillId: sConstruction.id }
    ]
  });

  // 4. Seed Open and In-Flight Jobs (near Amritsar)
  // workersAccepted and status are reconciled from applications at the end of the seed.
  const j1 = await prisma.job.create({
    data: {
      businessId: bSharma.userId,
      skillId: sRestaurant.id,
      title: 'Restaurant Kitchen Helper',
      description: 'Need helper for kitchen prep, vegetable cutting, and dishwashing during lunch & dinner rush.',
      workersRequired: 2,
      wage: 650,
      foodProvided: true,
      jobDate: addDaysISO(1),
      startTime: '10:00',
      endTime: '20:00',
      locality: 'Lawrence Road',
      latitude: 31.6375,
      longitude: 74.8780,
      status: JOB_STATUS.OPEN
    }
  });

  const j2 = await prisma.job.create({
    data: {
      businessId: bPunjab.userId,
      skillId: sLoading.id,
      title: 'Warehouse Goods Unloading',
      description: 'Unloading 2 trucks of boxed merchandise into the main warehouse bay. Tea & lunch provided.',
      workersRequired: 3,
      wage: 750,
      foodProvided: true,
      jobDate: localISODate(),
      startTime: '14:00',
      endTime: '21:00',
      locality: 'GT Road Industrial Area',
      latitude: 31.6250,
      longitude: 74.8650,
      status: JOB_STATUS.OPEN
    }
  });

  const j3 = await prisma.job.create({
    data: {
      businessId: bVerma.userId,
      skillId: sShop.id,
      title: 'Shop Counter Helper',
      description: 'Billing support and shelf restocking at the counter during evening hours.',
      workersRequired: 1,
      wage: 600,
      foodProvided: false,
      jobDate: addDaysISO(2),
      startTime: '09:00',
      endTime: '18:00',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      status: JOB_STATUS.OPEN
    }
  });

  const j4 = await prisma.job.create({
    data: {
      businessId: bVerma.userId,
      skillId: sShop.id,
      title: 'Stock Counting & Shelf Arrangement',
      description: 'Count and arrange incoming stock on the shelves before the store opens.',
      workersRequired: 1,
      wage: 550,
      foodProvided: false,
      jobDate: localISODate(),
      startTime: '08:00',
      endTime: '14:00',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      status: JOB_STATUS.IN_PROGRESS
    }
  });

  // 5. Seed Historical Completed Jobs (used for real ratings and counters)
  const h1 = await prisma.job.create({
    data: {
      businessId: bSharma.userId,
      skillId: sRestaurant.id,
      title: 'Dinner Rush Kitchen Helper',
      description: 'Dinner service helper for prep and dishwashing.',
      workersRequired: 2,
      wage: 650,
      foodProvided: true,
      jobDate: addDaysISO(-10),
      startTime: '16:00',
      endTime: '23:00',
      locality: 'Lawrence Road',
      latitude: 31.6375,
      longitude: 74.8780,
      status: JOB_STATUS.COMPLETED
    }
  });
  const h2 = await prisma.job.create({
    data: {
      businessId: bVerma.userId,
      skillId: sShop.id,
      title: 'Weekend Shop Helper',
      description: 'Helping customers and packing groceries on a busy weekend.',
      workersRequired: 1,
      wage: 600,
      foodProvided: false,
      jobDate: addDaysISO(-7),
      startTime: '09:00',
      endTime: '18:00',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      status: JOB_STATUS.COMPLETED
    }
  });
  const h3 = await prisma.job.create({
    data: {
      businessId: bPunjab.userId,
      skillId: sLoading.id,
      title: 'Truck Unloading Shift',
      description: 'Unloading one truck of cement bags into the godown.',
      workersRequired: 1,
      wage: 750,
      foodProvided: true,
      jobDate: addDaysISO(-5),
      startTime: '14:00',
      endTime: '21:00',
      locality: 'GT Road Industrial Area',
      latitude: 31.6250,
      longitude: 74.8650,
      status: JOB_STATUS.COMPLETED
    }
  });
  const h4 = await prisma.job.create({
    data: {
      businessId: bVerma.userId,
      skillId: sElectrician.id,
      title: 'Shop Wiring Repair',
      description: 'Fix a faulty tube light circuit and replace two switches.',
      workersRequired: 1,
      wage: 800,
      foodProvided: false,
      jobDate: addDaysISO(-3),
      startTime: '11:00',
      endTime: '15:00',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      status: JOB_STATUS.COMPLETED
    }
  });
  const h5 = await prisma.job.create({
    data: {
      businessId: bPunjab.userId,
      skillId: sPlumber.id,
      title: 'Godown Pipe Leakage Fix',
      description: 'Fix a leaking water pipe in the washroom and check the tank valve.',
      workersRequired: 1,
      wage: 700,
      foodProvided: false,
      jobDate: addDaysISO(-2),
      startTime: '10:00',
      endTime: '14:00',
      locality: 'GT Road Industrial Area',
      latitude: 31.6250,
      longitude: 74.8650,
      status: JOB_STATUS.COMPLETED
    }
  });
  const h6 = await prisma.job.create({
    data: {
      businessId: bSharma.userId,
      skillId: sCleaner.id,
      title: 'Restaurant Deep Cleaning',
      description: 'Deep clean of the dining hall and kitchen floor after renovation.',
      workersRequired: 1,
      wage: 500,
      foodProvided: true,
      jobDate: addDaysISO(-4),
      startTime: '08:00',
      endTime: '14:00',
      locality: 'Lawrence Road',
      latitude: 31.6375,
      longitude: 74.8780,
      status: JOB_STATUS.COMPLETED
    }
  });

  // 6. Seed Applications
  // Open jobs: one pending application, one withdrawn, one accepted (arrival code set).
  await prisma.application.create({
    data: { jobId: j1.id, workerId: wRahul.userId, status: APPLICATION_STATUS.APPLIED }
  });
  await prisma.application.create({
    data: { jobId: j1.id, workerId: wGurpreet.userId, status: APPLICATION_STATUS.WITHDRAWN }
  });
  await prisma.application.create({
    data: {
      jobId: j2.id,
      workerId: wAman.userId,
      status: APPLICATION_STATUS.ACCEPTED,
      arrivalOtp: '4821',
      appliedAt: localDateTime(-1, 19)
    }
  });

  // j3 is filled by Rahul; Gurpreet's pending application was rejected when it filled.
  await prisma.application.create({
    data: {
      jobId: j3.id,
      workerId: wRahul.userId,
      status: APPLICATION_STATUS.ACCEPTED,
      arrivalOtp: '5530'
    }
  });
  await prisma.application.create({
    data: { jobId: j3.id, workerId: wGurpreet.userId, status: APPLICATION_STATUS.REJECTED }
  });

  // j4 is in progress: Gurpreet arrived and started work this morning.
  await prisma.application.create({
    data: {
      jobId: j4.id,
      workerId: wGurpreet.userId,
      status: APPLICATION_STATUS.IN_PROGRESS,
      startedAt: localDateTime(0, 8, 10)
    }
  });

  // Historical completed applications (dates match the historical jobs above)
  const h1Times = completedTimes(-10);
  await prisma.application.create({
    data: { jobId: h1.id, workerId: wRahul.userId, status: APPLICATION_STATUS.COMPLETED, ...h1Times }
  });
  await prisma.application.create({
    data: { jobId: h1.id, workerId: wGurpreet.userId, status: APPLICATION_STATUS.COMPLETED, ...h1Times }
  });
  await prisma.application.create({
    data: { jobId: h2.id, workerId: wRahul.userId, status: APPLICATION_STATUS.COMPLETED, ...completedTimes(-7) }
  });
  await prisma.application.create({
    data: { jobId: h3.id, workerId: wAman.userId, status: APPLICATION_STATUS.COMPLETED, ...completedTimes(-5) }
  });
  await prisma.application.create({
    data: { jobId: h4.id, workerId: wRamesh.userId, status: APPLICATION_STATUS.COMPLETED, ...completedTimes(-3) }
  });
  await prisma.application.create({
    data: { jobId: h5.id, workerId: wJagjit.userId, status: APPLICATION_STATUS.COMPLETED, ...completedTimes(-2) }
  });
  await prisma.application.create({
    data: { jobId: h6.id, workerId: wGurpreet.userId, status: APPLICATION_STATUS.COMPLETED, ...completedTimes(-4) }
  });

  // 7. Seed Reviews (both directions for every completed application)
  // Business -> worker tags: PUNCTUAL, HARDWORKING, SKILLED, POLITE
  // Worker -> business tags: PAID_ON_TIME, FAIR_WORKLOAD, GOOD_FOOD, RESPECTFUL
  await review(h1.id, uSharma.id, uRahul.id, 5, 'PUNCTUAL', 'Reached on time and handled the dinner rush well.');
  await review(h1.id, uRahul.id, uSharma.id, 4, 'PAID_ON_TIME', 'Paid on time. Kitchen was busy but well organised.');
  await review(h1.id, uSharma.id, uGurpreet.id, 4, 'HARDWORKING', 'Worked hard on dishwashing all evening.');
  await review(h1.id, uGurpreet.id, uSharma.id, 5, 'GOOD_FOOD', 'Food was good and the team was respectful.');

  await review(h2.id, uVerma.id, uRahul.id, 4, 'SKILLED', 'Quick at billing and knows the shop layout.');
  await review(h2.id, uRahul.id, uVerma.id, 5, 'PAID_ON_TIME', 'Paid as agreed at the end of the day.');

  await review(h3.id, uPunjab.id, uAman.id, 4, 'HARDWORKING', 'Unloaded the whole truck without breaks.');
  await review(h3.id, uAman.id, uPunjab.id, 4, 'FAIR_WORKLOAD', 'Workload was fair for the wage.');

  await review(h4.id, uVerma.id, uRamesh.id, 5, 'SKILLED', 'Found the fault fast and fixed it neatly.');
  await review(h4.id, uRamesh.id, uVerma.id, 5, 'PAID_ON_TIME', 'Paid on time, no hassle.');

  await review(h5.id, uPunjab.id, uJagjit.id, 5, 'SKILLED', 'Fixed the leak properly the first time.');
  await review(h5.id, uJagjit.id, uPunjab.id, 4, 'RESPECTFUL', 'Respectful team and clear instructions.');

  await review(h6.id, uSharma.id, uGurpreet.id, 5, 'POLITE', 'Polite with customers and very thorough.');
  await review(h6.id, uGurpreet.id, uSharma.id, 4, 'PAID_ON_TIME', 'Paid on the same day.');

  // 8. Reconcile job counters and job status from the seeded applications
  const jobs = await prisma.job.findMany({ include: { applications: true } });
  for (const job of jobs) {
    const workersAccepted = job.applications.filter((a) => MATCHED_STATUSES.includes(a.status)).length;
    let status = job.status;
    if (status === JOB_STATUS.OPEN || status === JOB_STATUS.FILLED) {
      status = workersAccepted >= job.workersRequired ? JOB_STATUS.FILLED : JOB_STATUS.OPEN;
    }
    await prisma.job.update({ where: { id: job.id }, data: { workersAccepted, status } });
  }

  // 9. Reconcile worker ratings and counters from Review and Application rows
  const workers = await prisma.workerProfile.findMany({ select: { userId: true } });
  for (const w of workers) {
    const agg = await prisma.review.aggregate({
      where: { toUserId: w.userId },
      _avg: { rating: true },
      _count: { _all: true }
    });
    const jobsCompleted = await prisma.application.count({
      where: { workerId: w.userId, status: APPLICATION_STATUS.COMPLETED }
    });
    await prisma.workerProfile.update({
      where: { userId: w.userId },
      data: { rating: roundRating(agg._avg.rating), ratingCount: agg._count._all, jobsCompleted }
    });
  }

  // 10. Reconcile business ratings and counters from Review and Job rows
  const businesses = await prisma.business.findMany({ select: { userId: true } });
  for (const b of businesses) {
    const agg = await prisma.review.aggregate({
      where: { toUserId: b.userId },
      _avg: { rating: true },
      _count: { _all: true }
    });
    const jobsPosted = await prisma.job.count({ where: { businessId: b.userId } });
    const jobsCompleted = await prisma.job.count({
      where: { businessId: b.userId, status: JOB_STATUS.COMPLETED }
    });
    await prisma.business.update({
      where: { userId: b.userId },
      data: { rating: roundRating(agg._avg.rating), ratingCount: agg._count._all, jobsPosted, jobsCompleted }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
