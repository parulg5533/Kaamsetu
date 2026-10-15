import { prisma } from '@/lib/prisma';
import { handleRouteError, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      select: { id: true, name: true, slug: true, category: true, iconName: true },
      orderBy: { name: 'asc' },
    });
    return ok({ skills });
  } catch (err) {
    return handleRouteError(err, 'skills.list');
  }
}
