import fetch from 'node-fetch';

async function testApi() {
    const baseUrl = 'http://localhost:3000/api/data';
    // Using a known work_day_id from previous research
    const workDayId = '5a4efd22-ef9c-482d-8e9a-773a46976964';
    
    console.log(`Testing filtering for work_day_id: ${workDayId}`);
    
    try {
        const res = await fetch(`${baseUrl}/earnings?work_day_id=${workDayId}`);
        if (!res.ok) {
            console.error('API request failed:', await res.text());
            return;
        }
        
        const data = await res.json();
        console.log(`Results found: ${data.length}`);
        
        const allMatch = data.every((e: any) => e.work_day_id === workDayId);
        console.log(`All records match work_day_id: ${allMatch}`);
        
        if (data.length > 0) {
            console.log('Sample record:', data[0]);
        }
    } catch (e) {
        console.error('Error during test:', e);
    }
}

testApi();
