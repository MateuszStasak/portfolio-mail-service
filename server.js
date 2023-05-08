const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Joi = require('joi');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());

const port = +process.env.PORT || 3030;

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

transporter.verify().then(console.log).catch(console.error);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const schema = Joi.object({
  name: Joi.string().min(1).max(30),
  email: Joi.string().email().required(),
  message: Joi.string().min(1).max(300).required(),
});

app.post('/api/contact', (req, res) => {
  const { message, name, email } = req.body;

  const { error } = schema.validate({ name, email, message });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  let mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: process.env.MAIL_RECEIVER_USERNAME,
    subject: `Wiadomość z formularza kontaktowego od ${name}`,
    text: `Wiadomość od: ${email}\n\nTreść wiadomości: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send('An error occurred while sending the message');
    } else {
      console.log('Email sent: ' + info.response);
      res.send(`
      <div style="font-size: 18px; text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-family: Helvetica, Arial, sans-serif;">
        <p style="font-size: 24px; font-weight: 700;">Thank you for sending the message.</p>
        <p style="font-size: 24px;">I will try to answer it as soon as possible.</p>
        <br>
        <button onclick="history.back()" style="background-color: #487ACC; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Return to previous page
        </button>
      </div>
    `);
    }
  });
});

app.listen(port, () =>
  console.log(`The server is listening on port ${port}....`)
);
