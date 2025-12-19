const cron = require('node-cron');
const Entry = require('./models/Entry');
const Settings = require('./models/Settings');
const { sendReminderEmail } = require('./services/emailService');

let scheduledTask = null;

const runCheck = async () => {
    console.log('⏰ Running Daily Reminder Job...');
    try {
        const todayObj = new Date();
        const todayStr = todayObj.toISOString().split('T')[0];

        // Calculate 7 Days from now
        const nextWeekObj = new Date(todayObj);
        nextWeekObj.setDate(todayObj.getDate() + 7);
        const nextWeekStr = nextWeekObj.toISOString().split('T')[0];

        console.log(`Checking entries for: ${todayStr} (Release) and ${nextWeekStr} (1 Week Warning)`);

        const entries = await Entry.find({ date: { $in: [todayStr, nextWeekStr] } });

        if (entries.length === 0) {
            console.log('No entries found matching dates.');
            return;
        }

        for (const entry of entries) {
            if (entry.userEmail) {
                const daysUntil = entry.date === nextWeekStr ? 7 : 0;
                await sendReminderEmail(entry.userEmail, entry.title, entry.poster, daysUntil);
            } else {
                console.log(`Skipping entry "${entry.title}" - No email linked.`);
            }
        }
    } catch (error) {
        console.error('❌ Scheduler Error:', error);
    }
};

const startScheduler = async () => {
    try {
        // Fetch saved schedule or use default
        let settings = await Settings.findOne({ key: 'reminderTime' });

        // Default to 09:00 AM
        let cronExpression = '0 9 * * *';

        if (settings && settings.value) {
            const { hour, minute } = settings.value;
            cronExpression = `${minute} ${hour} * * *`;
            console.log(`Found saved schedule: ${hour}:${minute}`);
        } else {
            console.log("Using default schedule: 09:00 AM");
        }

        if (scheduledTask) {
            scheduledTask.stop();
        }

        scheduledTask = cron.schedule(cronExpression, runCheck);
        console.log(`✅ Scheduler Initialized with: ${cronExpression}`);
    } catch (error) {
        console.error("Failed to start scheduler:", error);
    }
};

const updateSchedule = async (hour, minute) => {
    // Save to DB
    await Settings.findOneAndUpdate(
        { key: 'reminderTime' },
        { value: { hour, minute } },
        { upsert: true, new: true }
    );

    // Update Task
    const cronExpression = `${minute} ${hour} * * *`;
    console.log(`🔄 Updating Schedule to: ${hour}:${minute} (${cronExpression})`);

    if (scheduledTask) {
        scheduledTask.stop();
    }
    scheduledTask = cron.schedule(cronExpression, runCheck);
};

module.exports = { startScheduler, updateSchedule };
