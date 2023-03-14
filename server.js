import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from "mongoose";
import * as model from './models/users.js'
import { fork } from 'child_process'
import parseArgs from 'minimist'
import Contenedor from './DB/contenedores/ContenedorMongoDb.js';
import log4js from 'log4js';
import twilio from 'twilio';

import config from './config.js'

import passport from "passport";
import { Strategy } from "passport-local";
const LocalStrategy = Strategy;

import bcrypt from 'bcrypt'

import cluster from 'cluster'
import os from 'os'

import compression from 'compression';

// MAIL

import { createTransport } from 'nodemailer';
const TEST_MAIL = 'adrien33@ethereal.email';

const transporter = createTransport({
  host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'adrien33@ethereal.email',
        pass: '9nAW7qaZufzJ7TGKN6'
    }
})

// WHATSAPP
const accountSid = 'ACa49230e31ef45b68f767fe2ab825beeb';
const authToken = 'd64a483d26f321d291fe1090f1da309d';

const client = twilio(accountSid, authToken);



import {
    productosDao as productosApi,
    carritosDao as carritosApi
} from './daos/index.js'

const app = express()

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(compression())

app.set('views', './views/pages')
app.set('view engine', 'ejs');

const advancedOptions = {
    useNewUrlParser: true,
    useUnifiedTopologu: true
}

// Passport-local
let usuarioActual
passport.use(new LocalStrategy(
    async function(email, password, done){
        console.log(`El usuario enviado desde l 45 es ${email} ${password}`)
        // Existe usuario devuelve el objeto del usuario (con ObjectId de Mongo)
        const existeUsuario = await model.usuarios.findOne({email: email})
        usuarioActual = existeUsuario
        console.log('Existe usuario: ' + existeUsuario)

        if(!existeUsuario){
            console.log('usuario no encontrado')
            return done(null, false)
        }
        else{
            const match = await verifyPass(existeUsuario, password)
            if (!match) {
                return done(null, false)
            }
            return done(null, existeUsuario);
        }
    }
))

passport.serializeUser((usuario, done) => {
    done(null, usuario);
});

passport.deserializeUser((nombre, done) => {
    model.usuarios.find({username: nombre})
    .then((res=>{
        done(null, res)
    }))
    .catch((err) =>{console.log('error desde deserializacion' + err)})
});


// middleware session
app.use(session(config.session))

// Passport
app.use(passport.initialize())
app.use(passport.session());

// Metodos de Auth con Bcrypt
async function generateHashPassword(password) {
    const hashPassword = await bcrypt.hash(password, 10)
    return hashPassword
}

async function verifyPass(usuario, password) {
    const match = await bcrypt.compare(password, usuario.password)
    console.log(`pass login: ${password} || pass hash: ${usuario.password}`)
    console.log(match)
    return match
}

function isAuth(req,res,next){
    if(req.isAuthenticated()){
        next()
    }
    else{
        res.redirect('/login')
    }
}

// Mongo DB
// mongoose.set('strictQuery', false)
// const URL = 'mongodb://localhost:27017/usuarios'
// mongoose.connect(URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })

app.get('/', isAuth, (req,res) =>{
    const nombre = req.session.passport.user.username
    const email = req.session.passport.user.email
    res.render('home',  {nombre: nombre, email: email})
})

app.get('/logout', (req, res) => {
    res.render('logout', {nombre: req.session.passport.user.username})
    req.session.destroy(err=>{
        if(err){
            res.json({status: 'Error al desloggearse', body: err})

        }
    })
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/login-error', (req, res) => {
    res.render('login-error');
})

app.get('/register',(req,res)=>{
    res.render('register')
})

app.post('/register', async (req,res) =>{
    let{ username, email, password, direccion, edad, telefono, foto } = req.body
    console.log(username, email, password)
    const newUser = {
        username: username,
        email: email,
        password: await generateHashPassword(password),
        direccion: direccion,
        edad: edad,
        telefono: telefono,
        foto: foto
    }
    saveUser(newUser)
    .then((res)=>{
        console.log(res)
    })
    res.redirect('/login');
})


app.post('/login', passport.authenticate('local', {successRedirect:'/', failureRedirect: '/login-error'}),
(req, res) => {
})
console.log("USUARIO ACTUAL: ", usuarioActual);
async function saveUser(user){
    const userSave = await model.usuarios.insertMany(user)
    return userSave
}

app.get('/logout', (req, res) => {
    res.render('logout', {nombre: req.session.nombre})
    req.session.destroy(err=>{
        if(err){
            res.json({status: 'Error al desloggearse', body: err})
            loggerError.error('Error al desloguearse')
        }
    })
    
})

// PRODUCTOS ------------------
app.get('/productos', async (req, res) => {
    const respuesta =  await productosApi.getAll()
    res.json({respuesta})
})

// POST. Agrega un producto y devuelve su id
app.post('/productos', async (req, res) => {
    const prod = await req.body
    console.log("prod: ", prod)
    const producto = {
        ...prod,
    }
    productosApi.save(producto)
    .then( respuesta => {
    res.render('formulario', {respuesta, registrado: true})
    })
})

// CARRITOS -------------------
// GET ALL
app.get('/carrito', async (req, res) => {
    const resp = await carritosApi.getAll()
    try
    {
        const info = await transporter.sendMail({
            from: 'Servidor Node.JS',
            to: TEST_MAIL,
            subject: 'Nuevo pedido',
            html: `<h1 style="color: blue;"> Se realizado un nuevo pedido <span style="color: green;" Muchas gracias</span></h1> <div>${resp}</div>`
          })
        console.log(info);
    }
    catch (e)
    {
        console.log(e)
    }

    try
    {
        const message = await client.messages.create({
        body: `Se ha realizado una nueva venta
        ${resp}`,
        from: '+13155993091',
        to: '+542234497220'
        });
    console.log(message);
    }
    catch (e)
    {
        console.log(e);
    }
    res.send(resp)
})

// POST. Crea un carrito y asigna un id
app.post('/carrito', async (req, res) => {
    let timestamp = Date.now()
    let productos = await req.body
    let nuevoCarrito = {
        items: productos,
        cart_timestamp: timestamp
    }
    carritosApi.save(nuevoCarrito)
    .then(id => res.send(`Carrito creado con el id ${id}`))
})

// DATOS PERSONALES
let datosPersonales;
app.get('/datos-personales', async (req, res) => {
    console.log(usuarioActual);
    datosPersonales = await model.usuarios.findOne({email: usuarioActual.email})
    res.json(datosPersonales)
    logger.info('Usuario accedio a la página de datos personales')
})


// PROCESS: Ruta info con datos del proceso
app.get('/info', (req,res)=>{
    const datos = {
        argumentos: process.argv.slice(2),
        plataforma: process.platform,
        version: process.version,
        rss: process.memoryUsage(),
        path: process.execPath,
        pid: process.pid,
        carpeta: process.cwd(),
        procesadores: CPU_CORES
    }
    res.send(datos)
})

// Ruta info bloqueante
app.get('/info-bloq', (req,res)=>{
    const datos = {
        argumentos: process.argv.slice(2),
        plataforma: process.platform,
        version: process.version,
        rss: process.memoryUsage(),
        path: process.execPath,
        pid: process.pid,
        carpeta: process.cwd(),
        procesadores: CPU_CORES
    }
    console.log(datos);
    res.send(datos)
})


// RUTA RANDOM
function calcular(cant) {
    return new Promise((resolve, reject) => {
        const forked = fork(path.resolve(process.cwd(), './calcularRandoms.js'))

        forked.on('message', mensaje => {
            if (mensaje == 'ready') {
                forked.send(cant)
            } else {
                resolve(mensaje)
            }
        })
    })
}

app.get('/api/randoms', async (req, res) => {
    const { cant = 100_000_000 } = req.query
    const result = await calcular(cant)
    res.json(result)
})


// Manejo de rutas inexistentes
app.get('*', ((req, res) => {
    res.send({ status: "error: -2", description: `ruta ${req.url} método ${req.method} no implementada` });
}))


// LOG4JS --------------
log4js.configure({

    appenders: {
        myLoggerConsole: {type: "console"},
        myLoggerFile: {type: "file", filename: "info.log"},
        myLoggerFile2: {type: "file", filename: "info2.log"},
        myLoggerFile3: {type: "file", filename: "warn.log"},
        myLoggerFile4: {type: "file", filename: "error.log"}
    },

    categories: {
        default: {appenders: ['myLoggerConsole'], level: 'trace'},
        console: {appenders: ['myLoggerConsole'], level: 'debug'},
        archivo: {appenders: ['myLoggerFile'], level: 'info'},
        archivo2: {appenders: ['myLoggerFile3'], level: 'warn'},
        archivo3: {appenders: ['myLoggerFile4', 'myLoggerFile2'], level: 'error'},
    }
})

const logger = log4js.getLogger("archivo")
const loggerWarn = log4js.getLogger("archivo2")
const loggerError = log4js.getLogger("archivo3")

logger.trace('Logger trace')
logger.debug('Logger debug')
logger.info('Logger info')
logger.warn('Logger warn')
logger.error('Logger error')
logger.fatal('Logger fatal')



// CLUSTER
const CPU_CORES = os.cpus().length
if (config.mode == 'CLUSTER' && cluster.isPrimary) {
    console.log('Cantidade de cores: ', CPU_CORES)
    
    for (let i = 0; i < CPU_CORES; i++) {
        cluster.fork()
    }
    
    cluster.on('exit', worker => {
        console.log(`Worker finalizó proceso ${process.pid} ${worker.id} ${worker.pid} finalizó el ${new Date().toLocaleString}`)
        cluster.fork()
    })
} else {
    app.listen(config.PORT, err => {
        if (!err) console.log(`Servidor http escuchando en el puerto ${config.PORT} - PID: ${process.pid}`)
    })
}

