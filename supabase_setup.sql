-- Run these commands in your Supabase SQL Editor to set up the database correctly.

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE,
    venue TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    college_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    event_id INTEGER REFERENCES events(id),
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    event_id INTEGER REFERENCES events(id),
    phone TEXT NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    event_name TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample Events
INSERT INTO events (name, description, venue) VALUES 
('Project Presentation', 'Technical event for showcasing projects', 'Room 107'),
('Reverse Engineering', 'Decode and understand systems', 'Room 114'),
('Hackathon', '24-hour coding challenge', 'Lab 1');
