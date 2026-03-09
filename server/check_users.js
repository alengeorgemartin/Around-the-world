import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';

dotenv.config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "ai_trip_planner" });
        const users = await User.find({}).select('-password');
        fs.writeFileSync('users_output.json', JSON.stringify(users, null, 2), 'utf8');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
