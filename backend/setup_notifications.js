const supabase = require('./db');

async function createNotificationsTable() {
    console.log("Checking for notifications table...");
    const { data, error } = await supabase.from('notifications').select('id').limit(1);
    
    if (error && error.code === 'PGRST116' || error && error.message.includes("does not exist")) {
        console.log("Table 'notifications' does not exist. Please create it in Supabase SQL Editor:");
        console.log(`
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `);
    } else if (error) {
        console.error("Unexpected error checking table:", error);
    } else {
        console.log("✅ Table 'notifications' already exists.");
    }
}

createNotificationsTable();
