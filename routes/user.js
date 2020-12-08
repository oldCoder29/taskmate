var userModel = require('../models/user');
var departmentModel = require('../models/department');
const Boom = require('boom');
const Joi = require('joi')

var {getHashedPassword,getErrorMessages } = require('../helpers/common');

//sanitise incoming data
const signupSchema = Joi.object().keys({
    username: Joi.string().required(),
    name: Joi.string().required(),
    department: Joi.string().required(),
    password: Joi.string().required(),
    
  });

async function saveUser(payload){

    const { error } = signupSchema.validate(payload);
    if (error) throw Boom.badRequest(getErrorMessages(error));
    
    //get user 
    const user = await checkExistingUser(payload.username);
    if (user) throw Boom.badRequest('Username exists');
    
    // get department
    const department = await checkDepartment(payload.department);
    if(!department) throw Boom.badRequest('Department doesnt exists');

    //hash password
    var hashedpassword = await getHashedPassword(payload.password)

    var insertObj = {
        name : payload.name,
        department : payload.department,
        username : payload.username,
        password : hashedpassword
    }
    console.log(insertObj);
    var _user = new userModel(insertObj);
    var userResult = await _user.save();
    return userResult;

}

function getUsers(payload){
   console.log(payload);
   let users = userModel.distinct('username',{department:payload});
   return users;
}

async function checkExistingUser(username){
    let user = await userModel.findOne({username:username});
    return user;
}
async function checkDepartment(department){
    let _department = await departmentModel.findOne({name:department});
    return _department;
}


module.exports = {
    saveUser,
    getUsers,
}