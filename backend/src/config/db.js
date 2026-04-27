const mysql = require('mysql2')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+05:00',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit:    4,   // stay under Clever Cloud's limit of 5
  queueLimit:         0,
})

pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+05:00'")
})

module.exports = pool.promise()