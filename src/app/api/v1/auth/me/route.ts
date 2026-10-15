import { getCurrentUser } from '@/lib/auth';
import { ok, handleRouteError } from '@/lib/http';
import { toMeUser } from '@/lib/me';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user: user ? toMeUser(user) : null });
  } catch (err) {
    return handleRouteError(err, 'auth/me');
  }
}
