const mongoose= require("mongoose");
const Schema=mongoose.Schema;
const {v4:uuidv4}=require("uuid");

const ActiveSchema= new Schema({
    name:{type:String,required:true},
    email:{type:String,required:true},
    socketID:{type:String, required:true},
    uid:{type:String,default:uuidv4()}
})

module.exports= Active= mongoose.model("active_chat",ActiveSchema);