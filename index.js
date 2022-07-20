const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const exerciseModel = require('./models/exercise.model');
const Exercise = exerciseModel.Exercise;
const User = require('./models/user.model')

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const cluster = process.env.CLUSTER;
const dbname = process.env.DB_NAME;

app.use(cors());

// Connection URI
const uri = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`

mongoose.connect(uri,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


//Add new user
app.post('/api/users', bodyParser.urlencoded({extended: false}), body('username').isLength({min: 1}), (request, response) => {
  const newUser = new User({username: request.body.username});

  const errors = validationResult(request);

  if (!errors.isEmpty()) {
      return response.status(400).json(`Username field shouldn't be empty. Please, enter a name`);
  }

  newUser.save((err, savedUser) => {
    if (err) {
      if (err.code === 11000) {
        // Duplicate username
        return response.status(400).json('User with this name is already exist. Choose another name');
      }
      // Some other error
      return response.status(500).json(err);
    } else {
      const responseObj = {};
      responseObj['username'] = savedUser.username
      responseObj['_id'] = savedUser.id
      response.json(responseObj)
    }
  })
})

// get ALL users
app.get('/api/users', (request, response) => {
  User.find({}, (err, arrayOfUsers) => {
    const usersResponseObj = arrayOfUsers.map(({username, _id}) => {
      return { username, _id }
    })

    if (!err) {
      response.json(usersResponseObj)
    } else {
      response.status(500).json('Oops, something went wrong')
    }
  })
})

// ADD new exercise
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}), (request, response) => {
  const newExercise = new Exercise({
    description: request.body.description,
    duration: parseInt(request.body.duration),
    date: request.body.date
  })

  if(newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0, 10)
  }

  User.findByIdAndUpdate(
    request.body[':_id'],
    {$push: {log: newExercise}},
    {new: true},
    (error, updatedUser) => {
      if(error) {
        return response.status(400).json('Something went wrong. Check fields in the form, please.');
      } else {
        const userObjectWithLog = {}
        userObjectWithLog['_id'] = updatedUser.id
        userObjectWithLog['description'] = newExercise.description
        userObjectWithLog['duration'] = newExercise.duration
        userObjectWithLog['date'] = new Date(newExercise.date).toDateString()
        userObjectWithLog['username'] = updatedUser.username

        response.json(userObjectWithLog)
      }
    }
  )
})

// GET logs for any user
app.get('/api/users/:_id/logs', (request, response) => {
  User.findById(request.params._id, (error, result) => {
    if(!error) {
      let userExerciseLogObj = result;
      let countOfLogs;

      if(request.query.from || request.query.to) {
        let fromDate = new Date(0);
        let toDate = new Date();
        
        if(request.query.from){
          fromDate = new Date(request.query.from);
        }
        
        if(request.query.to){
          toDate = new Date(request.query.to);
        }
        
        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        userExerciseLogObj.log = userExerciseLogObj.log.filter((exercise) => {
          const exerciseDate = new Date(exercise.date).getTime();
          
          return exerciseDate >= fromDate && exerciseDate <= toDate;
        });
        
        countOfLogs = userExerciseLogObj.log.length;
      }
      
      if (request.query.limit) {
        userExerciseLogObj.log = userExerciseLogObj.log.slice(0, request.query.limit);
      }

      if (request.query.limit > userExerciseLogObj.log.length) {
        return response.status(400).json(`This user has only ${userExerciseLogObj.log.length} exercises`);
      }
      
      userExerciseLogObj = userExerciseLogObj.toJSON();
      userExerciseLogObj['count'] = countOfLogs;
      response.json(userExerciseLogObj);
    } else {
      response.status(404).json('Oops, something went wrong');
    }
  });
});

