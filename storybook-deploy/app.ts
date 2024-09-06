import dotenv from 'dotenv';
import express from 'express';
import * as path from 'path';

const app = express();
dotenv.config();

// Basic auth logic
app.use(function (req, res, next) {
  let auth: string[] = [];

  // check whether an autorization header was send
  if (req.headers.authorization) {
    // only accepting basic auth, so:
    // * cut the starting "Basic " from the header
    // * decode the base64 encoded username:password
    // * split the string at the colon
    // -> should result in an array
    auth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
  }

  const username = process.env.PREVIEW_USER;
  const password = process.env.PREVIEW_PASS;

  // checks if:
  // * auth array exists
  // * first value matches the expected user
  // * second value the expected password
  if (!auth || auth[0] !== username || auth[1] !== password) {
    // any of the tests failed
    // send an Basic Auth request (HTTP Code: 401 Unauthorized)
    res.statusCode = 401;
    // MyRealmName can be changed to anything, will be prompted to the user
    res.setHeader('WWW-Authenticate', 'Basic realm="RsnFeSbpwvlexp"');
    // this will displayed in the browser when authorization is cancelled
    res.end('Unauthorized');
  } else {
    // continue with processing, user was authenticated
    next();
  }
});

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/', async (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'home.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
