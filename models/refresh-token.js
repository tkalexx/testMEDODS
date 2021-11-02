const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    userId: String,
    token: String,
    expires: Date,
    created: { type: Date, default: Date.now },
    createdByIp: String,
    revoked: {type: Date, default: null},
    revokedByIp: String,
    replacedByToken: String
});

module.exports = mongoose.model('RefreshToken', schema);