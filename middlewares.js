module.exports.isLoggedIn=(req,res,next)=>{
    if (!req.isAuthenticated())
    {
        return res.redirect('/');
    }
    next();
}


module.exports.isFaculty=(req,res,next)=>{
    if (!req.role=='faculty')
    {
        return res.redirect('/');
    }
    next();
}


module.exports.isStudent=(req,res,next)=>{
    if (!req.role=='student')
    {
        return res.redirect('/');
    }
    next();
}