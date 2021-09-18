const express = require('express');
const app = express();
const path = require('path');
var flash=require("connect-flash");
const passport = require("passport");
const User = require("./models/users");
const mongoose = require('mongoose');
const session = require('express-session')
const MongoStore = require('connect-mongo');
const LocalStrategy = require('passport-local');
const Announcement=require('./models/announcements');
const {isLoggedIn,isFaculty,isStudent}=require("./middlewares");



const dbUrl ='mongodb://localhost:27017/devathon';


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connnection error:"));
db.once("open", () =>
{
    console.log("Database Connected");
})


app.use(session(
    {
      secret:'secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ 
          mongoUrl: dbUrl,
          touchAfter: 24 * 3600
      }),
      
  }));


const sessionConfig = {
    name: 'uchimakavasaki',
    secret:'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',(req,res)=>{
    res.render('home')
})


app.get('/login_faculty',(req,res)=>{
    const role="faculty";
    res.render('users/login',{role});
})

app.post('/login_faculty',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login_faculty' }),(req,res)=>{
    req.role="faculty";
    res.send("loggedin");
})


app.get('/login_student',(req,res)=>{
    const role="student";
    res.render('users/login',{role});
})

app.post('/login_student',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login_student' }),(req,res)=>{
    req.role="student";
    res.send("loggedin");
})

app.get('/register_faculty',(req,res)=>{
    const role="faculty";
    res.render('users/register',{role});
})


app.post('/register_faculty',async (req,res)=>{
    const { email, Username, password,branch } = req.body;
    const role="faculty";
    const user = new User({ email,Username,role,branch});
    const registeredUser = await User.register({email:email,username:Username,role:role,branch: branch},password);
    req.login(registeredUser, err =>
        {
          if (err) return next(err);
          else
          {req.role="faculty";
          return res.send("faculty_registered");
        }
        })
    return res.send("faculty_registered")
})

app.get('/register_student',(req,res)=>{
    const role="student";
    res.render('users/register',{role});
})

app.post('/register_student',async (req,res)=>{
    const { email, Username, password,branch } = req.body;
    const role="student";
    const user = new User({ email,Username,role,branch});
    const registeredUser = await User.register({email:email,username:Username,role:role,branch: branch},password);
    req.login(registeredUser, err =>
        {
          if (err) return next(err);
          else
          {
          req.role="student";
          return res.send("student_registered");
          }
        })
    return res.send("student_registered")
})


app.get('/faculty_view',isLoggedIn,isFaculty,(req,res)=>{
    res.render('faculty_view/faculty_home')
})

app.get('/student_view',isLoggedIn,isStudent,async (req,res)=>{
    const announcements= await Announcement.find({});
    // console.log(announcements);
    res.render('student_view/student_home',{announcements});
})

app.get('/addannouncement',isLoggedIn,isFaculty,(req,res)=>{
    res.render('announcements/announcementForm')
})

app.post('/addannouncement',isLoggedIn,isFaculty,async (req,res)=>{
    const announcement=new Announcement({description:req.body.announcement});
    if(req.body.CSE)
    announcement.branches.push('CSE');
    if(req.body.ECE)
    announcement.branches.push('ECE');
    if(req.body.EEE)
    announcement.branches.push('EEE');
    await announcement.save();
    res.send(announcement);
})


const port = process.env.PORT || 3000;

app.listen(port, () =>
{
    console.log(`Connected On ${port}`)
})
