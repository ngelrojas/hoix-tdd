const transporter = require('../config/emailTransporter');

const sendActivationEmail = async (email, token) => {
  await transporter.sendMail({
    from: 'my app <info@angel.com>',
    to: email,
    subject: 'Account activation',
    html: `token is ${token}`,
  });
};

module.exports = { sendActivationEmail };
