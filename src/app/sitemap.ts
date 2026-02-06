import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://drivermind.vercel.app';
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // Since it's a SPA mainly controlled by auth state on home, 
        // strictly speaking we mainly want the home indexed.
        // But if there were specific landing pages, we'd add them here.
    ];
}
