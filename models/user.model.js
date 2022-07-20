const mongoose = require('mongoose')
const exerciseSchema = require('./exercise.model');

const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  log: [exerciseSchema.exerciseSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
