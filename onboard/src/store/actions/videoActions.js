import IO from 'socket.io-client/dist/socket.io';
import Peer from 'react-native-peerjs';
import {ALL_USERS, LOGIN_SUCCESS, REGISTER_SUCCESS,ADD_NEW_USER, MY_STREAM, ADD_STREAM, ADD_REMOTE_STREAM} from './types';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {ID} from './authActions';

// /** Web RTC */
import {mediaDevices} from 'react-native-webrtc';

//** API_URI */
export const API_URI = `http://192.168.43.164:5000`;

//With PeerJS, identifying peers is even simpler. Every peer is identified using nothing but an ID. A string that the peer can choose itself, or have a server generate one. Although WebRTC promises peer-to-peer communication, you still need a server anyway to act as a connection broker and handle signaling. PeerJS provides an open source implementation of this connection broker server PeerJS Server (written in Node.js), in case you do not want to use their cloud-hosted version (which is free right now, and comes with some limitations).
const peerServer = new Peer(undefined, {
  secure: false,
  config: {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
  },
});

peerServer.on('error', console.log);

//** Socket Config */
export const socket = IO(`${API_URI}`, {
  forceNew: true,
  jsonp:false
});

socket.on('connection', () => console.log('client Connection'));

export const joinGeneralRoom = () => async (dispatch) => {
    socket.on('connection', () => console.log('client Connection'));
     console.log('client socket id '+socket.id);//socket id of user
  socket.emit('join-general-room', 'ajsdflajslkdfuaisfjwioerwqiheriyqw87ery');//some random room id 
};

export const userJoin = () => async (dispatch, getState) => {
    const allUserRoomID='common-room-id';
    const roomID='active-room-id';
    const {user,allUsers}=getState().auth;//check this part
    console.log('Client side user: '+JSON.stringify(user));//{name: id: email}
    socket.emit("user-exists",{user:user,socketID:socket.id});//client socket

    socket.on("user-found",(currentUser)=>{
      console.log('currentUser'+JSON.stringify(currentUser))
        if(currentUser.length!=0 && currentUser[0].name){ 
          console.log('exist in database')
          //existing connection
            socket.emit('update-user',
               { user:currentUser[0],
                socketID:socket.id,
                allUserRoomID
            }
            )
        }

        else{//new connection
          console.log('new connection')

            socket.emit('user-join',{user:user,socketID:socket.id,allUserRoomID})
        }
    })

    //if you are the only user than add other users present in the room on the screen.

    socket.on("activeUsers",(users)=>{
//users=> the filtered list i am sending
      const grabUsers=allUsers.map(({email})=>email);
      const filter_otherUsers=users.map(({email,socketID,uid,_id,name})=>{
        if(!grabUsers.includes(email)){
          return{ //users other than ourself
            email,
            socketID,
            uid,
            _id,
            name
          }
        }
      }).filter((data)=>data!==undefined)
      console.log("all Users : ",JSON.stringify(grabUsers));
      console.log("other Users : ",JSON.stringify(filter_otherUsers));


      dispatch({type:ALL_USERS,payload:filter_otherUsers})
    })


    socket.on("new-user-join",(user)=>{
      dispatch({type:ADD_NEW_USER,payload:user})
    })

};

// Stream Actions
export const joinStream = (stream) => async (dispatch, getState) => {
  const {user}= getState().auth;
  const roomID='stream_general_room';
  dispatch({type:MY_STREAM,payload:stream});
  dispatch({type:ADD_STREAM,payload:{stream,...user}})


  //peer server acts as a connection broker for webrtc
  peerServer.on('open',(peerId)=>{
    socket.emit("join-stream-room",{
      roomID,
      peerId,
      socketID:socket.id,
      user
    })
  });

  socket.on("user-connected",({roomID,peerId,socketID,user})=>{
    connectToNewUser({roomID,peerId,socketID,user,stream});//the new user needs to be connected at everyone's end
  })
  

  peerServer.on('call',(call)=>{
//answer back to all remote streams
call.answer(stream);
//answer the remote calls back from last device
call.on('stream',(remoteStreams)=>{    //got all those streams that were calling
  dispatch({type:ADD_STREAM,
  payload:{
    stream:remoteStreams,
    name:`user_${ID()}`,
    email:"alwareadit@gmail.com",
    uid: `id_${ID()}`
  }

})

})
  })

};

function  connectToNewUser({roomID,peerId,socketID,user,stream}){
  //call the last user from other devices
  const call= peerServer.call(peerId,stream); //a call will be made and it needs to be answered by last user

  //other devices answer our last user
   call.on('stream',(lastUserStream)=>{
     if(lastUserStream)
     dispatch({type:ADD_REMOTE_STREAM,
    payload:{
      stream,
      lastUserStream,
      ...user
    }})

   })
}

export const disconnect = () => async () => {
  // peerServer.disconnect();
};

export const stream = () => async (dispatch) => {
  let isFront = true;
  mediaDevices.enumerateDevices().then((sourceInfos) => {
    let videoSourceId;
    for (let i = 0; i < sourceInfos.length; i++) {
      const sourceInfo = sourceInfos[i];
      if (
        sourceInfo.kind == 'videoinput' &&
        sourceInfo.facing == (isFront ? 'front' : 'environment')
      ) {
        videoSourceId = sourceInfo.deviceId;
      }
    }

    mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          mandatory: {
            minWidth: 500,
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode: isFront ? 'user' : 'environment',
          optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        },
      })
      .then((stream) => {
        dispatch(joinStream(stream));
      })
      .catch((error) => {
        console.log(error);
      });
  });
};

