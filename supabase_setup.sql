-- Run these commands in your Supabase SQL Editor to set up the database correctly.

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE,
    venue TEXT,
    category TEXT, -- 'Technical' or 'Non-Technical'
    is_team_event BOOLEAN DEFAULT FALSE,
    max_team_size INTEGER DEFAULT 1,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed'
    start_time TEXT, -- e.g., '10:30 AM'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_name UNIQUE (name)
);

-- Ensure team columns exist if table was already created
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_team_event BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;

-- Add unique constraint if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_event_name') THEN
        ALTER TABLE events ADD CONSTRAINT unique_event_name UNIQUE (name);
    END IF;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    event_names TEXT, -- Storing event names directly for readability
    team_members TEXT, -- JSON string mapping event names to team member lists
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS event_names TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_members TEXT;

-- Cleanup: Remove the old numeric event_id columns to avoid conflicts
DO $$ 
BEGIN 
    ALTER TABLE users DROP COLUMN IF EXISTS event_id;
    ALTER TABLE attendance DROP COLUMN IF EXISTS event_id;
    ALTER TABLE refreshment DROP COLUMN IF EXISTS event_id;
    ALTER TABLE food DROP COLUMN IF EXISTS event_id;
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    event_names TEXT,
    phone TEXT NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS event_names TEXT;

-- 4. Transaction History Table
CREATE TABLE IF NOT EXISTS transaction_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT,
    email TEXT,
    phone TEXT,
    event_id INTEGER,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount TEXT,
    status TEXT,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name TEXT,
    college_name TEXT,
    event_name TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS college_name TEXT;

-- 6. Refreshment Table (Stage 2)
CREATE TABLE IF NOT EXISTS refreshment (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    event_names TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE refreshment ADD COLUMN IF NOT EXISTS event_names TEXT;

-- 7. Food Table (Stage 3)
CREATE TABLE IF NOT EXISTS food (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    event_names TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE food ADD COLUMN IF NOT EXISTS event_names TEXT;

-- 8. Event Winners Table
CREATE TABLE IF NOT EXISTS event_winners (
  id SERIAL PRIMARY KEY,
  event_id INTEGER UNIQUE NOT NULL REFERENCES events(id),
  first_place VARCHAR(255),
  second_place VARCHAR(255),
  third_place VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Technical Registrations Table
CREATE TABLE IF NOT EXISTS technical_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    event_name TEXT,
    team_members TEXT, -- JSON string or comma-separated names of team members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE technical_registrations ADD COLUMN IF NOT EXISTS team_members TEXT;

-- 10. Non-Technical Registrations Table
CREATE TABLE IF NOT EXISTS non_technical_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    event_name TEXT,
    team_members TEXT, -- JSON string or comma-separated names of team members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE non_technical_registrations ADD COLUMN IF NOT EXISTS team_members TEXT;

-- Sample Events (Safe Upsert)
INSERT INTO events (name, description, venue, category) VALUES 
-- Technical Events
('Project Presentation', 'Showcase your technical projects', 'Room 107', 'Technical'),
('Reverse Engineering', 'Decode and understand systems', 'Room 114', 'Technical'),
('Code Debugging', 'Find and fix bugs in record time', 'Room 224', 'Technical'),
('Hackathon', 'Build something amazing in 24 hours', 'Lab 1', 'Technical'),
('Paper Presentation', 'Present your research papers', 'Seminar Hall', 'Technical'),
('Web Designing', 'Create stunning web interfaces', 'Lab 2', 'Technical'),
('App Development', 'Mobile app development challenge', 'Lab 3', 'Technical'),
('AI Quiz', 'Test your knowledge on AI & ML', 'Room 210', 'Technical'),
('Cyber Security Challenge', 'Ethical hacking and security', 'Lab 4', 'Technical'),
('Coding Contest', 'Competitive programming battle', 'Lab 5', 'Technical'),
('UI/UX Design', 'Design the best user experience', 'Room 118', 'Technical'),
('Cloud Computing Workshop', 'Hands-on cloud infrastructure', 'Room 305', 'Technical'),
('Robotics Demo', 'Showcase your robotic creations', 'Lab 6', 'Technical'),
('Data Science Challenge', 'Analyze data and find insights', 'Room 220', 'Technical'),

-- Non-Technical Events
('Adzap', 'Creative advertising challenge', 'Room 121', 'Non-Technical'),
('Just a Minute', 'Speak on a topic for 60 seconds', 'Room 115', 'Non-Technical'),
('Best Manager', 'Test your leadership skills', 'Room 113', 'Non-Technical'),
('Connections', 'Find the link between images', 'Room 110', 'Non-Technical'),
('Treasure Hunt', 'Find the hidden clues on campus', 'Campus Area', 'Non-Technical'),
('Debate', 'Argumentative speaking battle', 'Seminar Hall', 'Non-Technical'),
('Group Discussion', 'Formal discussion on current topics', 'Room 108', 'Non-Technical'),
('Mime', 'Silent storytelling performance', 'Auditorium', 'Non-Technical'),
('Photography', 'Capture the best moments', 'Entire Campus', 'Non-Technical'),
('Short Film', 'Showcase your filmmaking talent', 'Room 105', 'Non-Technical'),
('Quiz', 'General knowledge competition', 'Room 102', 'Non-Technical'),
('Stress Interview', 'Handle high-pressure questions', 'Room 101', 'Non-Technical'),
('Dance Battle', 'Show your best dance moves', 'Auditorium', 'Non-Technical'),
('Singing Contest', 'Vocal talent competition', 'Auditorium', 'Non-Technical'),
('Stand-up Comedy', 'Make the audience laugh', 'Seminar Hall', 'Non-Technical'),
('Fashion Show', 'Walk the ramp with style', 'Main Stage', 'Non-Technical'),
('Cooking Without Fire', 'Culinary creativity without heat', 'Room 109', 'Non-Technical'),
('Face Painting', 'Artistic expression on skin', 'Room 106', 'Non-Technical'),
('Rangoli', 'Traditional floor art contest', 'Entrance Area', 'Non-Technical'),
('Mehendi', 'Traditional henna art contest', 'Room 104', 'Non-Technical'),
('Dumb Charades', 'Act out the movie names', 'Room 111', 'Non-Technical'),
('Open Mic', 'Share your talent on stage', 'Auditorium', 'Non-Technical')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    venue = EXCLUDED.venue,
    category = EXCLUDED.category;