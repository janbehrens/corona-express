require('dotenv').config()
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const passport = require('passport')
const mongoose = require('mongoose')
const plm = require('passport-local-mongoose')
const cors = require('cors')

const app = express()
const port = 3000

app.use(cors())
app.use(session({ secret: 'covid-WzcVXFfznM9at6cJ9Q9', resave: false, saveUninitialized: false }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(passport.initialize())
app.use(passport.session())

// MongoDB

const mongoHost = process.env.MONGO_HOST
const mongoDb = process.env.MONGO_DB
const mongoUser = process.env.MONGO_USER
const mongoPass = process.env.MONGO_PASS
const mongoAuthSource = process.env.MONGO_AUTH_SOURCE

mongoose.connect(`mongodb://${mongoUser}:${mongoPass}@${mongoHost}/${mongoDb}?authSource=${mongoAuthSource}`, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))

const UserSchema = new mongoose.Schema({
  email: String,
})
UserSchema.plugin(plm)
const User = mongoose.model('user', UserSchema, 'user')

const HelpOfferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'user' },
  name: String,
  address: mongoose.Schema.Types.Mixed,
  message: String,
  tasks: [String],
  checkup: {
    healthy: String,
    healthDetail: String
  }
})
const HelpOffer = mongoose.model('offer', HelpOfferSchema, 'offer')

const HelpRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'user' },
  name: String,
  address: mongoose.Schema.Types.Mixed,
  message: String,
  tasks: [String],
  checkup: {
    condition: String,
    conditionDetail: String
  }
})
const HelpRequest = mongoose.model('request', HelpRequestSchema, 'request')

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

passport.use(User.createStrategy())

app.post('/register', (req, res, next) => {
  // Creates and saves a new user with a salt and hashed password
  User.register(new User(req.body), req.body.password, (err, user) => {
    if (err) {
      return next(err)
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/users/' + user.username)
      })
    }
  })
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err)
    }
    if (!user) {
      return res.json(info)
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err)
      }
      return res.redirect('/users/' + user.username)
    })
  })(req, res, next)
})

app.get('/users/:username', (req, res, next) => {
  User.findOne({ username: req.params.username }, (err, user) => {
    if (err) {
      return next(err)
    }
    res.json({
      _id: user.id,
      username: user.username
    })
  })
})

app.post('/offers', bodyParser.json(), (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  const offer = new HelpOffer(req.body)
  offer.save((err, product) => {
    if (err) {
      next(err)
    }
    res.send(product)
  })
})

app.get('/offers', (req, res, next) => {
  HelpOffer.find((err, documents) => {
    if (err) {
      next(err)
    }
    res.send(documents)
  })
})

app.post('/requests', bodyParser.json(), (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  const request = new HelpRequest(req.body)
  request.save((err, product) => {
    if (err) {
      next(err)
    }
    res.send(product)
  })
})

app.get('/requests', (req, res, next) => {
  HelpRequest.find((err, documents) => {
    if (err) {
      next(err)
    }
    res.send(documents)
  })
})

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening on port ${port}`);
  }
})
