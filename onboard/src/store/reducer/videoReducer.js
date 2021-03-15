import { ADD_REMOTE_STREAM, ADD_STREAM ,MY_STREAM} from '../actions/types';

const initialState = {
  myStream:null,//stream of current user
  streams:[],
  remoteStreams:[]
};

export default (state = initialState, {type, payload}) => {
  switch (type) {

    case MY_STREAM:
      return {
        ...state,myStream:payload
      }

    case ADD_STREAM:
      const streams=state.streams.filter(({email})=>email!=payload.email)//if user leaves and joins again dont show dupllicate streams
      return{...state,streams:[streams,payload]}
    
    case ADD_REMOTE_STREAM:
      const otherstreams=state.remoteStreams.filter(({email})=>email!=payload.email)
      return{
           ...state,streams:[...otherstreams,payload]
      }
    default:
      return state;
  }
};