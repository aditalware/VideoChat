const express = require("express");
const app = express();
const http = require("http");
const server = http.Server(app);
const socketio = require("socket.io");
// const { ExpressPeerServer } = require("peer");
const mongoose = require("mongoose");
const config = require("config");


const io = socketio(server);

// console.log(io);
// var io = require('socket.io').listen(server); 

//** Peer Server */
const customGenerationFunction = () =>
  (Math.random().toString(36) + "0000000000000000000").substr(2, 16);

// const peerServer = ExpressPeerServer(server, {
//   debug: true,
//   path: "/",
//   generateClientId: customGenerationFunction,
// });

// app.use("/mypeer", peerServer);


// get the active chat database
const Active=require('./schema/Active')

//** Config */
const db = config.get("mongoURI");

// connect mongodb
mongoose.connect(db,{
  useCreateIndex:true,
  useFindAndModify:false,
  useNewUrlParser:true,
  useUnifiedTopology:true
}).then(()=>console.log('Connected to MongoDb'))
.catch((err)=>console.log(err));


app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/index.html');
});

//* Websocket *//
io.on("connection", function (socket) {
  console.log('socketid '+socket.id); //server socket id

  socket.on("join-general-room",(roomID)=>{
    console.log('room '+roomID);//any random sent room id from client
    socket.join(roomID);//A room is an arbitrary channel that sockets can join and leave. It can be used to broadcast events to a subset of clients:
//You can call join to subscribe the socket to a given channel:

  });

  socket.on('user-exists',({user,socketID})=>{
    console.log('Server: socket on user exists'+JSON.stringify(user)+' '+JSON.stringify(socketID));

    Active.find({email:user.email}).then((user)=>{
      io.in(socketID).emit("user-found",user);//client socket id

    })
  });

  socket.on("update-user",({user,socketID,allUserRoomID})=>{
    socket.join(allUserRoomID);//join the client user in allroomid (previously it was aiasnanknasn some random)

    //find user and update id
    Active.findOneAndUpdate(
      {email:user.email},
      {$set:{socketID}},//whenever program runs client socket id changes
      {new:true},
      (err,doc)=>{
        if(doc){//if update happens
          //send active users to last connected user
         Active.find({}).then(allUsers=>{
           const otherUsers=allUsers.filter(({email:otherEmails})=>otherEmails!=user.email)

           io.in(socketID).emit("activeUsers",otherUsers);//to tell our current connection about other connections

         });

        }


      }
      
      );

      //notify other users about new user
      socket.to(allUserRoomID).broadcast.emit("new-user-join",[{...user,socketID}]);

  });

  socket.on("user-join",({user,socketID,allUserRoomID})=>{
    socket.join(allUserRoomID);
    // console.log(user);

    //store new user in active chats
    const active= new Active({...user,socketID})
    //check if this user does not exist for being on safer side
    Active.findOne({email:user.email}).then((user)=>{
      if(!user){// if this is the new user save it
        active.save().then(({email})=>{
          //send all other users notification that this user is being added
          Active.find({}).then(allUsers=>{//find all users
            const otherUsers=allUsers.filter(({email:otherEmails})=>otherEmails!=email)
 //send others to new connected user
            io.in(socketID).emit("activeUsers",otherUsers);
 
          });

        })
      }

      else{
        socket.to(allUserRoomID).broadcast.emit("new-user-join",user);//doubtfull

      }
    })


  });

  socket.on("join-stream-room",({roomID,peerId,socketID,user})=>{
        socket.join(roomID);
        //emit to other users in same room
        socket.to(roomID).broadcast.emit('user-connected',{roomID,peerId,socketID,user});
  })

});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server started on port ${port}`));