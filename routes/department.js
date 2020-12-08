var departmentModel = require('../models/department');

async function saveDepartment(payload){

    const department = await checkDepartment(payload.department);
    if(department) throw Boom.badRequest('Department exists');

    let insertObj = {
        name : payload.department
    }
    var _department = new departmentModel(insertObj);
    var depResult = await _department.save();
    return depResult;
}

async function getDepartment(department){
    console.log(department);
    var _department = await departmentModel.distinct('name',{name:{$ne:department}})
    return _department;
}

async function checkDepartment(department){
    let _department = await departmentModel.findOne({department:department});
    return _department;;
}

module.exports = {
    saveDepartment,
    getDepartment
}