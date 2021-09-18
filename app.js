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
const Seating=require('./models/seating');
const {isLoggedIn,isFaculty,isStudent}=require("./middlewares");
const announcements = require('./models/announcements');



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
    return res.redirect("/faculty_view");
})


app.get('/login_student',(req,res)=>{
    const role="student";
    res.render('users/login',{role});
})

app.post('/login_student',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login_student' }),(req,res)=>{
    req.role="student";
    return res.redirect("/student_view");
})

app.get('/register_faculty',(req,res)=>{
    const role="faculty";
    res.render('users/register',{role});
})


app.post('/register_faculty',async (req,res)=>{
    var { email, Username, password,branch } = req.body;
    branch=branch.toUpperCase();
    const role="faculty";
    const user = new User({ email,Username,role,branch});
    const registeredUser = await User.register({email:email,username:Username,role:role,branch: branch},password);
    req.login(registeredUser, err =>
        {
          if (err) return next(err);
          else
          {req.role="faculty";
        //   return res.redirect("/faculty_view");
        }
        })
        return res.redirect("/faculty_view");
})

app.get('/register_student',(req,res)=>{
    const role="student";
    res.render('users/register',{role});
})

app.post('/register_student',async (req,res)=>{
    var { email, Username, password,branch } = req.body;
    branch=branch.toUpperCase();
    const role="student";
    const user = new User({ email,Username,role,branch});
    const registeredUser = await User.register({email:email,username:Username,role:role,branch: branch},password);
    req.login(registeredUser, err =>
        {
          if (err) return res.redirect('/');
          else
          {
          req.role="student";
          req.branch=branch;
        //   return res.redirect("/student_view");
          }
        })
        return res.redirect("/student_view");
})


app.get('/faculty_view',isLoggedIn,isFaculty,(req,res)=>{
    res.render('faculty_view/faculty_home')
})

app.get('/student_view',isLoggedIn,async (req,res)=>{
    const announcementsALL= await Announcement.find({branches:"ALL"});
    const announcementsSpecific= await Announcement.find({branches:req.user.branch});
    const half = Math.ceil(announcementsALL.length / 2);
    const announcementsALL1= announcementsALL.slice(0, half)
    const announcementsALL2= announcementsALL.slice(-half)


    const half2 = Math.ceil(announcementsSpecific.length / 2);
    const announcementsSpecific1= announcementsSpecific.slice(0, half2)
    const announcementsSpecific2= announcementsSpecific.slice(-half2)

    const seatin= await Seating.find({branch:req.user.branch}).sort({ $natural: -1 }).limit(1);
    res.render('student_view/student_home',{announcementsALL1,announcementsALL2,announcementsSpecific1,announcementsSpecific2,seating:seatin[0].seating});
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
    if(req.body.MECH)
    announcement.branches.push('MECH');
    if(req.body.CHEM)
    announcement.branches.push('CHEM');
    if(req.body.CIVIL)
    announcement.branches.push('CIVIL');
    if(req.body.MME)
    announcement.branches.push('MME');
    if(req.body.BIO)
    announcement.branches.push('BIO');
    if(req.body.ALL)
    announcement.branches.push('ALL');
    await announcement.save();
    const announcementsALL= await Announcement.find({branches:"ALL"});
    const announcementsSpecific= await Announcement.find({branches:req.user.branch});
    
    const half = Math.ceil(announcementsALL.length / 2);
    const announcementsALL1= announcementsALL.slice(0, half)
    const announcementsALL2= announcementsALL.slice(-half)


    const half2 = Math.ceil(announcementsSpecific.length / 2);
    const announcementsSpecific1= announcementsSpecific.slice(0, half2)
    const announcementsSpecific2= announcementsSpecific.slice(-half2)

    const seating= await Seating.find({branch:req.user.branch}).limit(1);

    console.log(seating);

    res.render('student_view/student_home',{announcementsALL1,announcementsALL2,announcementsSpecific1,announcementsSpecific2,seating});
})

app.get('/seating',(req,res)=>{
    res.render('seatingPlan');
})

app.post('/seating',async (req,res)=>{
    if(req.body.zig)
    {const arrange=new Seating({seating: 'zig',branch: req.user.branch});
    await arrange.save();
}
    if(req.body.Decrease)
    {const arrange=new Seating({seating: 'Decrease',branch: req.user.branch});
    await arrange.save();
}
    if(req.body.Increase)
    {const arrange=new Seating({seating: 'Increase',branch: req.user.branch});
    await arrange.save();
}
    res.render('faculty_view/faculty_home')
})

app.get('/logout',(req,res)=>{
    req.logout();
    return res.redirect("/");
})


const port = process.env.PORT || 3000;

app.listen(port, () =>
{
    console.log(`Connected On ${port}`)
})
