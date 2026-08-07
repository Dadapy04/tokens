import { redirect } from 'next/navigation';

export default async function Page() {
    redirect('/?tab=api-manager');
}
