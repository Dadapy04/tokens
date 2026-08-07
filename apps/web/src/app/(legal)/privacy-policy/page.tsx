import type { Metadata } from 'next';
import { privacyPolicyDocument } from '../legal-content';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
    title: 'Privacy Policy | Tokens',
    description: 'Privacy Policy for Tokens services provided by Solana Foundation.',
};

export default function PrivacyPolicyPage() {
    return <LegalPage document={privacyPolicyDocument} />;
}
