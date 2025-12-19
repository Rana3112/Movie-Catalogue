const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'utkarshrana40@gmail.com',
        pass: 'wnlv lhna oiac wbcn' // NOTE: This MUST be an "App Password", not your login password.
    }
});

const sendReminderEmail = async (to, movieTitle, posterUrl, daysUntil = 0) => {
    if (!to) return;

    let subject = `🎬 Reminder: "${movieTitle}" is here!`;
    let headline = "It's Time! 🍿";
    let bodyText = `Just a quick reminder that <strong>${movieTitle}</strong> is scheduled for today.`;

    if (daysUntil > 0) {
        subject = `⏳ Upcoming: "${movieTitle}" in ${daysUntil} days!`;
        headline = `${daysUntil} Days to Go! 🗓️`;
        bodyText = `Get ready! <strong>${movieTitle}</strong> is coming up in ${daysUntil} days.`;
    }

    const mailOptions = {
        from: 'utkarshrana40@gmail.com',
        to: to,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #fff; padding: 20px; border-radius: 10px;">
                <h2 style="color: #ffd700; text-align: center;">${headline}</h2>
                <p style="text-align: center; font-size: 16px;">
                    ${bodyText}
                </p>
                ${posterUrl ? `
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${posterUrl}" alt="Poster" style="max-width: 200px; border-radius: 8px; border: 2px solid #333;">
                    </div>
                ` : ''}
                <p style="text-align: center; color: #888; font-size: 14px;">
                    Keep an eye on your calendar!<br>
                    - Movie Catalogue
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to} for ${movieTitle}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = { sendReminderEmail };
