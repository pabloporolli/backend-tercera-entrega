import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from "mongoose";
import * as model from './models/users.js'
import { fork } from 'child_process'

import config from './config.js'

import passport from "passport";
import { Strategy } from "passport-local";
const LocalStrategy = Strategy;

import bcrypt from 'bcrypt'

const app = express()

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

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
        carpeta: process.cwd()
    }
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




app.listen(config.PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${config.PORT}`)
})
