import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const token = (await cookies()).get('admin_token')?.value;

  redirect(token ? '/dashboard' : '/login');
}
