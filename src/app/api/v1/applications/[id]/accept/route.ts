import { handleRouteError, ok } from '@/lib/http';
import { requireBusiness } from '@/lib/auth';
import { acceptApplication } from '@/lib/lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireBusiness();
    const result = await acceptApplication(params.id, user.id);
    return ok(result);
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/applications/[id]/accept');
  }
}
