import Script from 'next/script';

type GoogleAnalyticsProps = {
    measurementId: string;
};

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    const normalizedMeasurementId = measurementId.trim().toUpperCase();

    if (!GA_MEASUREMENT_ID_PATTERN.test(normalizedMeasurementId)) {
        console.warn(`Invalid GA measurement ID: ${measurementId}`);
        return null;
    }

    const serializedMeasurementId = JSON.stringify(normalizedMeasurementId);

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(normalizedMeasurementId)}`}
            />
            <Script
                id={`google-analytics-${normalizedMeasurementId}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', ${serializedMeasurementId});
                `,
                }}
            />
        </>
    );
}
