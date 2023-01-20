import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'

import config from './config.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.set('views', './views/pages')
app.set('view engine', 'ejs');

const advancedOptions = {
    useNewUrlParser: true,
    useUnifiedTopologu: true
}

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

app.get('/', (req, res) => {
    if(req.session.nombre){
        res.render('home', {nombre: req.session.nombre})
    }
    else{
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    res.render('logout', {nombre: req.session.nombre})
    
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req,res) =>{
    let nombre = req.body.nombre;
    req.session.nombre = nombre
    res.redirect('/');
})

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
