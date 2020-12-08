const userModel = require('../models/user');
const Joi = require('joi');
const Boom = require('boom');

var {getErrorMessages, comparePassword, generateToken } = require('../helpers/common');

const basicSchema = Joi.object().keys({
    username: Joi.string().optional(),
    password: Joi.string().required(),
  });

async function login(payload) {
    return new Promise(async (resolve, reject) => {
        try {
            const { error } = basicSchema.validate(payload);
            if (error) throw Boom.badRequest(getErrorMessages(error));
        
            const user = await getUser(payload.username, payload.username);
            if (!user) throw Boom.badRequest('User doesn\'t exists');
        
            const isMatch = await comparePassword(payload.password, user.password);
            if (!isMatch) {
              throw Boom.badRequest('Username or password you entered is incorrect');
            }
      
            /** Generating the token */
            const token = generateToken(payload.username);
        
            resolve({ user, token });
          } catch (err) {
            reject(err)
          }
    })
    
  };


  async function getUser(username){
    let user = await userModel.findOne({username:username});
    return user;
}

module.exports = {
    login
}