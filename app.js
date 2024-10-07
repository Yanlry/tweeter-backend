require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var tweetsRouter = require('./routes/tweets');

var app = express();

const cors = require('cors');

// Configuration CORS pour autoriser uniquement les requêtes provenant de ton frontend sur Vercel
app.use(cors({
  origin: 'https://hackatweet-frontend-alpha.vercel.app',  // URL de ton frontend déployé
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true,  // Si tu utilises des cookies ou des sessions
}));

// Gérer les requêtes préalables (preflight requests)
app.options('*', cors());  // Cette ligne permet de gérer toutes les requêtes OPTIONS

// Ajout manuel des en-têtes CORS si nécessaire
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://hackatweet-frontend-alpha.vercel.app');  // Assure que l'en-tête est présent
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/tweets', tweetsRouter);

module.exports = app;
