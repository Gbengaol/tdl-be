const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(req) {
    const { email } = req;
    this.to = email;
    this.from = `Gbenga Olufeyimi <gbqngq@gmail.com>`;
    this.data = req;
  }

  newTransport() {
    //Use Sendgrid to send Email
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
  }
  // Send the actual email
  async send(template, subject, data) {
    // 1.) Render the HTML for the email based on the pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        subject,
        data,
      }
    );

    // 2.) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.fromString(html),
      html,
    };

    // 3.) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async forgotPassword() {
    await this.send("passwordReset", "Password Reset", this.data);
  }
  async welcomeEmail() {
    await this.send(
      "welcome",
      "Welcome to Gbenga's Todolist Application.",
      this.data
    );
  }
};
