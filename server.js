import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from "mongoose";
import * as model from './models/users.js'
import { fork } from 'child_process'
import parseArgs from 'minimist'

import config from './config.js'

import passport from "passport";
import { Strategy } from "passport-local";
const LocalStrategy = Strategy;

import bcrypt from 'bcrypt'

import cluster from 'cluster'
import os from 'os'

import compression from 'compression';
import log4js from 'log4js';

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
passport.use(new LocalStrategy(
    async function(email, password, done){
        console.log(`El usuario enviado desde l 45 es ${email} ${password}`)
        // Existe usuario devuelve el objeto del usuario (con ObjectId de Mongo)
        const existeUsuario = await model.usuarios.findOne({email: email})
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
mongoose.set('strictQuery', false)
const URL = 'mongodb://localhost:27017/usuarios'
mongoose.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

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
    let{ username, email, password } = req.body
    console.log(username, email, password)
    const newUser = {
        username: username,
        email: email,
        password: await generateHashPassword(password)
    }
    saveUser(newUser)
    .then((res)=>{
        console.log(res)
    })
    res.redirect('/login');
})

app.post('/login', passport.authenticate('local', {successRedirect:'/', failureRedirect: '/login-error'}))

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
    logger.info('Usuario accedio a la página info')
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
    logger.info('Usuario accedio a la página info')
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


// LOG4JS **** LOGGEO
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

// const logger = log4js.getLogger("archivo")
// const loggerWarn = log4js.getLogger("archivo2")
// const loggerError = log4js.getLogger("archivo3")

// logger.trace('Logger trace')
// logger.debug('Logger debug')
// logger.info('Logger info')
// logger.warn('Logger warn')
// logger.error('Logger error')
// logger.fatal('Logger fatal')


// Manejo de rutas inexistentes
app.get('*', ((req, res) => {
    res.send({ status: "error: -2", description: `ruta ${req.url} método ${req.method} no implementada` });
    loggerWarn.warn(`Ingreso a ruta no existente: ${req.url}`)
}))


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



