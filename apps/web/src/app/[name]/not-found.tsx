import type { Metadata } from 'next';
import { NotFoundContent } from '../not-found-content';

export const metadata: Metadata = {
    title: '404 | Tokens',
    description: 'The page was not found. Play Tokens Asteroids and head back to Tokens.',
};

export default function TokenNotFound() {
    return <NotFoundContent />;
}
