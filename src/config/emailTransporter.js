const nodemailer = require('nodemailer');
const config = require('config');
// const nodemailerStub = require('nodemailer-stub');
// const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);
const mailConfig = config.get('mail');

const transporter = nodemailer.createTransport({ ...mailConfig });

module.exports = transporter;
