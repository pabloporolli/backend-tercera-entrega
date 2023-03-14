import mongoose from 'mongoose'
import pkg from 'mongoose';
const { model } = pkg;
import config from '../../config.js'

await mongoose.connect(config.mongodb.cnxStr, config.mongodb.options)

class ContenedorMongoDb {

    constructor(nombreColeccion, esquema) {
        this.coleccion = mongoose.model(nombreColeccion, esquema)
    }

    async getById(id) {
        const leerUno = await this.coleccion.find({id: id})
        console.log(leerUno);
        return (leerUno)
    }

    async getAll() {
        const leerTodo = await this.coleccion.find()
        console.log(leerTodo);
        return leerTodo
    }

    async save(nuevoElem) {
        const data = await this.coleccion.find()
        let id = 0
        data.length === 0 ? id = 1 : id = data.length + 1
        const elementoSaved = await this.coleccion.insertMany({
            ...nuevoElem,
            id: id
        })
        console.log('Elemento guardado', id);
        return id
    }

    async modifyById(pos, nuevoElem) {
        const elemUpdate = await this.coleccion.updateOne({id: pos}, {$set: nuevoElem})
    }

    async deleteById(id) {
        const del = await this.coleccion.deleteOne({id: id})
    }

    async deleteAll() {
        const delAll = await this.coleccion.deleteAll()
    }

    async modifyCarritoById (pos, nuevoElem) {
        console.log(nuevoElem);
        const elemUpdate = await this.coleccion.updateOne({id: pos}, {$addToSet: {productos: nuevoElem}})
    }

}

export default ContenedorMongoDb