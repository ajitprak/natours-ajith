const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

// Ussage - new Email(user, url).sendEmail()
module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Ajith Prakash<${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return 1;
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER_NAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // we are creating a generic send so that other send s in our class can use it
    async sendEmail(template, subject) {
        // 1) Create template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });

        // 2) Create email Options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            // text: htmlToText.fromString(html),// fromString is deprecated
            text: htmlToText(html),
        };

        // 3) Send email
        await this.newTransport().sendMail(emailOptions);
    }

    async sendWelcome() {
        await this.sendEmail('welcome', 'Welcome to Natours Family !!!');
    }

    async sendResetPassword() {
        await this.sendEmail('password-reset', 'Your Password Reset Token (Valid for only 10 mins !!!)');
    }
};

// OLD Code
// const sendEmail = async (options) => {
//     // 1) Create transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USER_NAME,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//     });

//     // 2) Define email options
//     const emailOptions = {
//         from: 'Ajith Prakash<admin@sample.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//     };

//     // 3) Send email
//     await transporter.sendMail(emailOptions);
// };

// module.exports = sendEmail;
