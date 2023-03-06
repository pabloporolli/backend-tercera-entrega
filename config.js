import dotenv from 'dotenv'
import parseArgs from 'minimist'
import path from 'path'
import MongoStore from 'connect-mongo'

dotenv.config()

const argv = parseArgs(process.argv.slice(2), {
    alias: {
        p: 'port',
        m: 'mode'
    },
    default: {
    port: 8080,
    mode: 'FORK'
    }
})

export default {
    PORT: argv.port,
    mode: argv.mode,
    mongoLocal: {
        
    },
    mongoRemote: {
        
    },
    sqlite3: {
        
    },
    mariaDb: {
        client: 'mysql',
        connection: {
            host: '127.0.0.1',
            user: 'root',
            password: 'root',
            database: 'coderhouse_01',
            port: 8889
        }
    },
    fileSystem: {
        path: "contenedor.json"
    },
    session: {
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
    }
}
