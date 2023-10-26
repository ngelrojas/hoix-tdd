const transporter = require('../config/emailTransporter');
const { getTestMessageUrl } = require('nodemailer');

const sendActivationEmail = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'my app <info@angel.com>',
    to: email,
    subject: 'Account activation',
    html: `<div>
      <b>please click below link to activate your account</b>
      token is ${token}
      <div>
        <a href="http://localhost:8080/#/login?token=${token}">activate</a>
      </div>
      </div>`,
  });
  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', getTestMessageUrl(info));
  }
};

module.exports = { sendActivationEmail };
