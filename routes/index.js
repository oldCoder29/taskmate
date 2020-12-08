const router = require('express').Router();
const {saveUser, getUsers} = require('./user')
const {saveDepartment, getDepartment} = require('./department');
const {login} = require('./authentication');
const querystring = require('querystring'); 
const {verifyToken} = require('../helpers/common');

router.get('/',(req,res)=>{
    res.render('login')
})
router.get('/login',(req,res)=>{
    res.render('login')
})

router.get('/signup',(req,res)=>{
    res.render('register')
})
router.get('/logout',(req,res)=>{
    res.render('login')
})

router.get('/request',async (req,res,next)=>{
    var payload = req.query
    if(!payload.token){
        next(new Error('Token required'))
    }
    var {username} = verifyToken(paylaod.token);
    if(username!=payload.username){
        next(new Error('Token Invalid'));
    }
    res.render('requests',{result:payload})
})

router.post('/signup',async (req,res,next)=>{
    try {
        var payload = req.body;
        var response = await saveUser(payload);
        res.redirect('login')
    }catch(err) {
        console.log(err);
        next(err)
    }
    
})

router.get('/users', async (req,res,next)=>{
    var payload = req.query;
    console.log(payload);
    let response = await getUsers(payload.department)
    res.send({satus:true, data:response})
})

router.post('/login',async(req, res, next)=>{ 
    try {
        var paylaod = req.body;
    var result = await login(paylaod);
    if(result){
        console.log(result);
        const query = querystring.stringify({
            username : result.user.username,
            department : result.user.department,
            token :result.token
        });
        res.redirect('/request?' + query);
    }
    } catch (error) {
        next(error)
    }
})

router.get('/department', async (req,res,next)=>{
    var payload = req.query;
    let response = await getDepartment(payload.department)
    res.send({satus:true, data:response})
})

router.post('/department', async (req,res,next)=>{
    var payload = req.body;
    let response = await saveDepartment(payload);
    res.send({satus:true, data:response})
})
module.exports = router