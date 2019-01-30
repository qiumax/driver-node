var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();

var config = require('./config/Config')
app.set('config', config);

// DB
mongoose.Promise = global.Promise;
var db_url = config.mongodb.url;
var db_options = {
    useNewUrlParser: true,
    auto_reconnect:true
}
var db = mongoose.connection;
db.on('connecting', function() {
    console.log('connecting to MongoDB...');
});
db.on('error', function(error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
db.on('connected', function() {
    console.log('MongoDB connected!');
});
db.once('open', function() {
    console.log('MongoDB connection opened!');
});
db.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    connectWithRetry();
});
var connectWithRetry = function() {
    mongoose.connect(db_url, db_options)
    .catch((err) => {
        console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
        setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

var session = require('express-session');
const RedisStore = require('connect-redis')(session);
var RedisClient = require("./models/Redis");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    store: new RedisStore({
        host: config.redis.host,
        port: config.redis.port,
        pass: config.redis.pwd,
        ttl: config.redis.ttl,
        client: RedisClient
    }),
    secret: "sany_driver_plat",
    cookie: { maxAge: 86400*1000 },
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

var user = require('./routes/user');
var driver = require('./routes/driver');
var wx = require('./routes/wx');
var sms = require('./routes/sms');
var order = require('./routes/order');

// passport configuration
var User = require('./models/User');
passport.use(new LocalStrategy({
        usernameField:'username',
        passwordField:'password'
    },
    function (username, password, done) {
        User.findOne({'openid': username}).then(function (user) {
            if(user) {
                return done(null, user);
            }
            else {
                return done(null, false, {message: '用户不存在'});
            }
        })
    }
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/api', function (req, res, next) {
    console.log(req.body);
    
    var session_id = req.body.s_id;
    var user_id = req.body.user_id;
    console.log("session_id: " + session_id);
    console.log("user_id: " + user_id);

    if(session_id && user_id) {
        RedisClient.get(session_id, function (err, reply) {
            if(reply) {
                var sess = JSON.parse(reply);
                var user_id_in_session = sess.uid;
                if(user_id_in_session==user_id) {
                    req.session.driver_id = sess.driver_id;
                    return next();
                }
                else {
                    res.json({err: "expired"});
                }
            }
            else {
                res.json({err: "expired"});
            }
        })
    }
    else {
        res.json({err: "expired"});
    }
});

app.use('/api/user', user);
app.use('/api/driver', driver);
app.use('/api/order', order);
app.use('/wx', wx);
app.use('/api/sms', sms);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

var schedule = require("node-schedule");
var NeedController = require('./controllers/NeedController');
schedule.scheduleJob('0 * * * * ?', function(){
    console.log("runing schedule job at " + new Date());
    
    NeedController.check();
})

module.exports = app;
