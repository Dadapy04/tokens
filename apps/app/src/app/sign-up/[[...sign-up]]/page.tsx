import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Create account | Tokens',
};

export default function Page() {
    redirect('/sign-in');
}
