export default function JsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'DriverMind',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
            '@type': 'Offer',
            price: '16.90',
            priceCurrency: 'BRL',
        },
        description: 'Aplicativo de controle financeiro para motoristas de aplicativo (Uber, 99).',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
