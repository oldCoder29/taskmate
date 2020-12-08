const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || "$3Cr#T"
const JWT_TOKEN_TIME = process.env.JWT_TOKEN_TIME || 90000000

function generateToken(username) {
  const payloads = { username };
  const token = jwt.sign(payloads, JWT_SECRET, { expiresIn:JWT_TOKEN_TIME });
  return token;
}

function getHashedPassword(password) {
  return new Promise((resolve, reject) => {
    // generate a salt
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return reject(err);
      // hash the password using our new salt
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return reject(err);
        // override the cleartext password with the hashed one
        return resolve(hash);
      });
    });
  });
}

function comparePassword(candidatePassword, savedPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, savedPassword, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
}

function getErrorMessages(error) {
  if (error.details && error.details.length > 0) {
    return error.details.reduce((acc, v) => {
      acc.push(v.message);
      return acc;
    }, []).join('\n');
  }
  return error.message;
}

function verifyToken(token){
  return new Promise((resolve, reject) => {
    try {
      if (!token) throw Boom.unauthorized('token needed');
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          //  proxyAuthRequired returns HTTP Status code 429 which is RESEREVED for the token expire scenario.
          if (err.name === 'TokenExpiredError') {
            throw Boom.proxyAuthRequired(err.name);
          }
          logger.error(`The error while decoding token ${err}`, { file: 'authTokenVerify.handler.js', function: 'authorization' });
          throw err;
        }
        const { username } = decoded;
        resolve ({username });
      });
    } catch (err) {
      reject(err);
    }
  })
}


module.exports = {
 generateToken,
 getErrorMessages,
 getHashedPassword,
 comparePassword,
 verifyToken,
};