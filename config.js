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
            user: process.env.MARIADB_USER,
            password: process.env.MARIADB_PASSWORD,
            database: process.env.MARIADB_DATABASE,
            port: process.env.MARIADB_PORT
        }
    },
    fileSystem: {
        path: process.env.FILESYSTEM
    },
    session: {
        store: MongoStore.create({
            // local
            mongoUrl: process.env.MONGO_URL
        }),
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 10000
        }
    }
}
