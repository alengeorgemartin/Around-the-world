import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

async function checkPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "ai_trip_planner" });
        const user = await User.findOne({ email: 'prathuish@gmail.com' });
        if (!user) {
            console.log('User not found');
        } else {
            console.log('Password hash in DB:', user.password);
            const isMatch = await bcrypt.compare('123456', user.password);
            console.log('Does 123456 match?', isMatch);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPassword();
