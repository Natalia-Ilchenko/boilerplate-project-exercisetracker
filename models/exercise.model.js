const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: String
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
module.exports = exerciseSchema;
