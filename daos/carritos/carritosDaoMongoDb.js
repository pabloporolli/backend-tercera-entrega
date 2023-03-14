import ContenedorMongoDb from "../../DB/contenedores/ContenedorMongoDb.js"

class CarritosDaoMongoDb extends ContenedorMongoDb {

    constructor() {
        super('carritos', {
            productos: { type: [], required: true },
            id: {type: Number},
            cart_timestamp: {type: Number}
        })
    }

    // async save(carrito = { productos: [] }) {
    //     return super.save(carrito)
    // }
}

export default CarritosDaoMongoDb
