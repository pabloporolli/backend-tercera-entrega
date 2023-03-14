import mongoose from "mongoose";

const productos = "productos"
const Schema = mongoose.Schema

const productosSchema = new Schema({
    id: {type: Number},
    mane: {type: String},
    url: {type: String},
    stock: {type: Number}
})

export const productosLista = mongoose.model(productos, productosSchema)