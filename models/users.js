import mongoose from "mongoose";

const users = "usuarios"
const Schema = mongoose.Schema

const usuariosSchema = new Schema({
    username: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    direccion: {type: String},
    edad: {type: Number},
    telefono: {type: Number},
    foto: {type: String}
})

export const usuarios = mongoose.model(users, usuariosSchema)