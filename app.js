const http = require('http')
const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Boom = require('boom');
const mongoose = require('mongoose');

const MongoOptions = {
    socketTimeoutMS: 0,
    reconnectTries: 30,
    keepAlive: 300000,
    connectTimeoutMS: 30000,
    useNewUrlParser: true,
  };

  const DBURI = process.env.DBURI || "mongodb://localhost:27017/tasker"
  mongoose.connect(DBURI, MongoOptions);

  mongoose.connection.on('connected', () => {
    console.log(`Mongoose default connection open`);
  });

  // If the connection throws an error
  mongoose.connection.on('error', (err) => {
    console.log(`Mongoose default connection error: ${err}`);
    throw err;
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
  });

const routes = require('./routes')
const {saveRequest, getAllRequests, updateStatus} = require('./routes/request');


const app = express()
const server = http.createServer(app) //io requires raw http
const io = socketio(server)

// const publicDirectoryPath = path.join(__dirname, './public')
// app.use(express.static(publicDirectoryPath))



app.set('views', path.join(__dirname, './views'));
  app.set('view engine', 'ejs');

  

app.use(bodyParser.json({
    limit: '50mb',
    strict: true,
  }));

  // parses the url encoded strings
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
  }));

app.use(morgan(':method :status :res[content-length] - :response-time ms'));

var socketEntry = {}
var reverseEntry = {};

io.use(function(socket, next){
    console.log("Query: ", socket.handshake.query);

    socketEntry[socket.handshake.query.username] = socket.id;
    reverseEntry[ socket.id] = socket.handshake.query.username
    // return the result of next() to accept the connection.
    //add authenticatin layer here for jwt skipping for now
    if (socket.handshake) {
        return next();
    }
    // call next() with an Error if you need to reject the connection.
    next(new Error('Authentication error'));
});

io.on('connection', async socket => {
    socket.broadcast.emit("showMessage", { name: 'Anonymous', message: 'A NEW USER HAS JOINED' })
    console.log("a user have joined")
    console.log(socket.id);
      var allrequest =  await getAllRequests(reverseEntry[socket.id]);
    io.to(socket.id).emit('allRequests',allrequest)

    socket.on('sendRequest',async message=>{ 
      console.log("new message received : ", message)
      var saveObj ={};
      saveObj["department"]=message.department;
      saveObj["created_by"]=message.created_by;
      saveObj["assigned_to"]=message.assigned_to;
      saveObj["user_department"]=message.user_department;
      saveObj["message"]=message.message;
      saveObj["seen"]=false;
      saveObj["status"] = "Pending";
      var response = await saveRequest(saveObj);
      //send updates
      io.emit(message.department,{message: response,"name":"New Request Added"})
      io.to(socketEntry[message.assigned_to]).emit('newEntry',{name : "you",message:response})
      io.to(socket.id).emit('createResponse',{name : "you",message:response});
    });

    socket.on('rejectRequest',async message =>{
      console.log("reject request")
      var id = message.request_id
      var response = await updateStatus(id,"Rejected");
      io.to(socketEntry[response.assigned_to]).emit('requestRejected',{name : "you",message:response})
      io.to(socket.id).emit('rejectSuccess',{name : "you",message:response});
      // io.emit(response.department,{message: response,"message":"Request rejected"})
      io.emit(response.user_department,{message: response,"name":"Request rejected"})
    })

    socket.on('acceptRequest',async message =>{
      console.log("aprove request");
      var id = message.request_id
      var id = message.request_id
      var response = await updateStatus(id,"Approved");
      io.to(socketEntry[response.assigned_to]).emit('requestApproved',{name : "you",message:response})
      io.to(socket.id).emit('approveSuccess',{name : "you",message:response});
      // io.emit(response.department,{message: response,"message":"request approved"})
      io.emit(response.user_department,{message: response,"name":"Request approved"})
    })
    
})

app.use("/", routes);


app.use((req, res, next) => {
    next(Boom.notFound('Invalid endpoint'));
  });

  app.use((err, req, res, next) => {
    // Convert if error does not belong to Boom object
    console.log(`URL : ${req.originalUrl}`);
    const _err = err.isBoom ? err : Boom.boomify(err, { statusCode: 500 });
    /** Boom error */
    const payload = {
      error: _err.output.payload.error,
      message: _err.message,
      statusCode: _err.output.payload.statusCode,
    };
    console.log(`Name: ${payload.error} | message: ${payload.message} | status: ${payload.statusCode}`);
    res.status(payload.statusCode).json({
      success: false,
      data: payload,
    });
    next();
  });

const port = process.env.PORT || 3000
server.listen(port, () => console.log('Server is running...'))