import { destroySession } from '@/lib/auth';
import { ok, handleRouteError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    destroySession();
    return ok({});
  } catch (err) {
    return handleRouteError(err, 'auth/logout');
  }
}
