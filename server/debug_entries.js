const mongoose = require('mongoose');
const Entry = require('./models/Entry');
const dotenv = require('dotenv');
const path = require('path');

// Load env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

const run = async () => {
    try {
        console.log("Connecting to Mongo...");
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const today = new Date().toISOString().split('T')[0];
        console.log("Scheduler thinks TODAY is:", today);

        const entries = await Entry.find({});
        console.log("\n--- DB ENTRIES ---");
        if (entries.length === 0) {
            console.log("No entries found in DB collection.");
        }
        entries.forEach(e => {
            console.log(`Title: ${e.title}, Date: "${e.date}" (Type: ${typeof e.date}), Email: ${e.userEmail}`);
        });
        console.log("------------------\n");
    } catch (err) {
        console.error("DEBUG ERROR:", err);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit();
    }
};

run();
