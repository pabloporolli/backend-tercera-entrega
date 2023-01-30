import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from "mongoose";
import * as model from './models/users.js'

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
    async function(username, password, done){
        console.log(`El usuario enviado desde l 45 es ${username} ${password}`)
        // Existe usuario devuelve el objeto del usuario (con ObjectId de Mongo)
        const existeUsuario = await model.usuarios.findOne({username: username})
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
app.use(session({
    store: MongoStore.create({
        // local
        mongoUrl: "mongodb://localhost/sesionesDesafio12"
    }),
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 10000
    }
}))

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
const URL = 'mongodb://localhost:27017/usuarios'
await mongoose.connect(URL, {
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



app.listen(config.PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${config.PORT}`)
})
