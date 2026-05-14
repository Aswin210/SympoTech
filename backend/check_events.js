const supabase = require('./db');

async function checkEvents() {
    try {
        const { data, error } = await supabase.from('events').select('*');
        if (error) {
            console.error('Error fetching events:', error);
            return;
        }
        console.log('Events in DB (count):', data.length);
        if (data.length > 0) {
            console.log('Sample Event Keys:', Object.keys(data[0]));
            console.log('First Event Data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No events found in table.');
        }
    } catch (e) {
        console.error('Script error:', e);
    }
}

checkEvents();
