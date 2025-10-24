import mongoose from "mongoose";
const { Schema } = mongoose;

/** user model */
const userModel = new Schema({
    username : { type : String, required: true, unique: true },
    email : { type : String, unique: true, sparse: true },
    password : { type : String, required: true },
    firstName : { type : String },
    lastName : { type : String },
    phone : { type : String },
    dateOfBirth : { type : Date },
    gender : { type : String, enum: ['male', 'female', 'other'] },
    education : { type : String },
    occupation : { type : String },
    userType : { type : String, default: 'user', enum: ['user', 'admin'] },
    isActive : { type : Boolean, default: true },
    lastLogin : { type : Date },
    totalQuizzesTaken : { type : Number, default: 0 },
    averageScore : { type : Number, default: 0 },
    bestScore : { type : Number, default: 0 },
    createdAt : { type : Date, default : Date.now},
    updatedAt : { type : Date, default : Date.now}
});

export default mongoose.model('User', userModel);