import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KaamSetu database...');

  // Clean existing records in correct relation order
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.workerSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Skills
  const sRestaurant = await prisma.skill.create({
    data: { name: 'Restaurant Helper', category: 'HOSPITALITY', iconName: 'utensils' }
  });
  const sShop = await prisma.skill.create({
    data: { name: 'Shop Helper', category: 'RETAIL', iconName: 'store' }
  });
  const sLoading = await prisma.skill.create({
    data: { name: 'Loading / Unloading', category: 'LOGISTICS', iconName: 'package' }
  });
  const sDelivery = await prisma.skill.create({
    data: { name: 'Delivery Helper', category: 'LOGISTICS', iconName: 'truck' }
  });
  const sCleaner = await prisma.skill.create({
    data: { name: 'Cleaner & Housekeeping', category: 'HOSPITALITY', iconName: 'sparkles' }
  });
  const sConstruction = await prisma.skill.create({
    data: { name: 'General Construction Helper', category: 'MANUAL', iconName: 'hammer' }
  });
  const sElectrician = await prisma.skill.create({
    data: { name: 'Electrician & Wiring', category: 'TECHNICAL', iconName: 'zap' }
  });
  const sPlumber = await prisma.skill.create({
    data: { name: 'Plumber & Pipe Fitting', category: 'TECHNICAL', iconName: 'wrench' }
  });
  const sCarpenter = await prisma.skill.create({
    data: { name: 'Carpenter & Woodwork', category: 'MANUAL', iconName: 'hammer' }
  });
  const sPainter = await prisma.skill.create({
    data: { name: 'Painter & Whitewash', category: 'MANUAL', iconName: 'paint-brush' }
  });


  // 2. Seed Businesses
  // Business 1: Sharma Restaurant
  const uSharma = await prisma.user.create({
    data: {
      phone: '9812345678',
      name: 'Sharma Ji',
      role: 'BUSINESS'
    }
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
      rating: 4.6,
      ratingCount: 28,
      jobsPosted: 34,
      jobsCompleted: 30
    }
  });

  // Business 2: Verma Kirana Store
  const uVerma = await prisma.user.create({
    data: {
      phone: '9812345679',
      name: 'Rajesh Verma',
      role: 'BUSINESS'
    }
  });
  await prisma.business.create({
    data: {
      userId: uVerma.id,
      businessName: 'Verma Kirana Store',
      businessType: 'Retail Grocery Store',
      address: '22 Hall Bazaar, Chowk Phowara',
      city: 'Amritsar',
      locality: 'Hall Bazaar',
      latitude: 31.6310,
      longitude: 74.8765,
      rating: 4.8,
      ratingCount: 15,
      jobsPosted: 18,
      jobsCompleted: 17
    }
  });

  // Business 3: Punjab Logistics Hub
  const uPunjab = await prisma.user.create({
    data: {
      phone: '9812345680',
      name: 'Harpreet Singh',
      role: 'BUSINESS'
    }
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
      rating: 4.4,
      ratingCount: 42,
      jobsPosted: 50,
      jobsCompleted: 45
    }
  });

  // 3. Seed Workers
  // Worker 1: Rahul Kumar
  const uRahul = await prisma.user.create({
    data: {
      phone: '9876543210',
      name: 'Rahul Kumar',
      role: 'WORKER'
    }
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
      rating: 4.7,
      ratingCount: 32,
      jobsCompleted: 38,
      attendanceRate: 94.0
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
    data: {
      phone: '9876543211',
      name: 'Aman Singh',
      role: 'WORKER'
    }
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
      rating: 4.5,
      ratingCount: 18,
      jobsCompleted: 21,
      attendanceRate: 90.0
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
    data: {
      phone: '9876543212',
      name: 'Gurpreet Kaur',
      role: 'WORKER'
    }
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
      rating: 4.9,
      ratingCount: 26,
      jobsCompleted: 30,
      attendanceRate: 98.0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wGurpreet.userId, skillId: sCleaner.id },
      { workerId: wGurpreet.userId, skillId: sShop.id }
    ]
  });

  // Worker 4: Ramesh Kumar (Electrician)
  const uRamesh = await prisma.user.create({
    data: {
      phone: '9876543213',
      name: 'Ramesh Mistri',
      role: 'WORKER'
    }
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
      rating: 4.8,
      ratingCount: 45,
      jobsCompleted: 52,
      attendanceRate: 96.0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wRamesh.userId, skillId: sElectrician.id }
    ]
  });

  // Worker 5: Jagjit Singh (Plumber)
  const uJagjit = await prisma.user.create({
    data: {
      phone: '9876543214',
      name: 'Jagjit Singh',
      role: 'WORKER'
    }
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
      rating: 4.7,
      ratingCount: 38,
      jobsCompleted: 41,
      attendanceRate: 93.0
    }
  });
  await prisma.workerSkill.createMany({
    data: [
      { workerId: wJagjit.userId, skillId: sPlumber.id },
      { workerId: wJagjit.userId, skillId: sConstruction.id }
    ]
  });


  // 4. Seed Active Jobs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const j1 = await prisma.job.create({
    data: {
      businessId: bSharma.userId,
      skillId: sRestaurant.id,
      title: 'Restaurant Kitchen Helper',
      description: 'Need helper for kitchen prep, vegetable cutting, and dishwashing during lunch & dinner rush.',
      workersRequired: 2,
      workersAccepted: 0,
      wage: 650,
      foodProvided: true,
      jobDate: tomorrowStr,
      startTime: '10:00',
      endTime: '20:00',
      locality: 'Lawrence Road',
      latitude: 31.6375,
      longitude: 74.8780,
      status: 'OPEN'
    }
  });

  const j2 = await prisma.job.create({
    data: {
      businessId: bPunjab.userId,
      skillId: sLoading.id,
      title: 'Warehouse Goods Unloading',
      description: 'Unloading 2 trucks of boxed merchandise into the main warehouse bay. Tea & lunch provided.',
      workersRequired: 3,
      workersAccepted: 1,
      wage: 750,
      foodProvided: true,
      jobDate: todayStr,
      startTime: '14:00',
      endTime: '21:00',
      locality: 'GT Road Industrial Area',
      latitude: 31.6250,
      longitude: 74.8650,
      status: 'OPEN'
    }
  });

  // Pre-seed 1 application from Aman to Job 2 (Accepted)
  await prisma.application.create({
    data: {
      jobId: j2.id,
      workerId: wAman.userId,
      status: 'ACCEPTED'
    }
  });

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
