import type { Metadata } from 'next';
import { termsDocument } from '../legal-content';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
    title: 'Terms of Service | Tokens',
    description: 'Terms of Service for Tokens services provided by Solana Foundation.',
};

export default function TermsPage() {
    return <LegalPage document={termsDocument} />;
}
