var requestModel = require('../models/request');
var userModel = require('../models/user');
const Boom = require('boom');
const Joi = require('joi')
var mongoose = require('mongoose');

var {getErrorMessages } = require('../helpers/common');
const user = require('./user');

const createSchema = Joi.object().keys({
  created_by: Joi.string().required(),
  assigned_to: Joi.string().required(),
  message: Joi.string().required(),
  department: Joi.string().required(),
  user_department: Joi.string().required(),
  status : Joi.string().optional(),
  seen : Joi.boolean().optional(),
});

async function saveRequest(payload){

    console.log(payload);

    const { error } = createSchema.validate(payload);
    if (error) throw Boom.badRequest(getErrorMessages(error));



    const _request = new requestModel({
        status: payload.status,
        department : payload.department,
        message: payload.message,
        created_by: payload.created_by,
        assigned_to: payload.assigned_to,
        user_department: payload.user_department
      });
    const response = await _request.save();
    return response;
}

async function getPendingRequests(payload){
    var username  = payload.username;
    var response = await requestModel.find({assigned_to:username,status:"Pending"})
    console.log("pending response",response);
    return response
}

async function getApprovedRequests(payload){
    var username  = payload.username;
    var response = await requestModel.find({assigned_to:username,status:"Approved"})//.sort({"date":-1}).limit(5)
    return response
}

async function getRejectedRequests(payload){
    var username  = payload.username;
    var response = await requestModel.find({created_by:username,status:"Rejected"})//.sort({"date":-1}).limit(5);
    return response
}

async function getRequestedRequests(payload){
    var username  = payload.username;
    var response = await requestModel.find({created_by:username})//.sort({"date":-1}).limit(5)
    return response
}

async function getDepartmentRequest(payload){
    var department  = payload.department;
    console.log(department);
    var response = await requestModel.find({department:department})//.sort({"date":-1}).limit(5)
    console.log("department requests: ",response);
    return response
}

async function getAllRequests(username){
    //get user details
    var _user = await checkExistingUser(username);
    var department = _user.department;
    var pending = await getPendingRequests({username});
    var approved = await getApprovedRequests({username});
    var rejected = await getRejectedRequests({username});
    var userRequested = await  getRequestedRequests({username});
    var departmentRequest = await getDepartmentRequest({department});
    return {pending,approved,rejected,userRequested,departmentRequest}
}

async function checkExistingUser(username){
    let user = await userModel.findOne({username:username});
    return user;
}

async function updateStatus(id,status){
    
    var objectId = mongoose.Types.ObjectId(id);
    var response = await requestModel.findByIdAndUpdate(objectId, {status:status}, { new: true }).exec();
    var request = await  requestModel.findById(objectId)
    return request
}

module.exports = {
    saveRequest,
    getAllRequests,
    getPendingRequests,
    getApprovedRequests,
    getRejectedRequests,
    getRequestedRequests,
    getDepartmentRequest,
    updateStatus,
}
