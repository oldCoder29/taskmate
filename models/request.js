const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema for Users
const RequestSchema = new Schema({

    message: {
        type: String,
        required: true,
    },
    created_by: {
        type: String,
        required: true,
    },
    assigned_to: {
        type: String,
        required: true,
    },
    department : {
        type: String,
        required: true,
    },
    user_department : {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "Pending",
    },
    seen: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('request', RequestSchema);

