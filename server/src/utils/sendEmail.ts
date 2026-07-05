import nodemailer from 'nodemailer';

const sendEmail = async (options: {
  email: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Business Nexus" <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  console.log(`Sending email to: ${options.email}`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully: ${info.messageId}`);
};

export default sendEmail;
