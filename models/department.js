const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema for Users
const DepartmentSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        default: Date.now,
    },
});

module.exports = mongoose.model('department', DepartmentSchema);
