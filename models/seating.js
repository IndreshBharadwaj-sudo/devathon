const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SeatingSchema = new Schema({
    seating: {
        type: String,
        required: true
    },
    branch :{
        type: String,
        required: true
    }
})
module.exports = mongoose.model('Seating', SeatingSchema);