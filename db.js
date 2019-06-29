const mysql = require('mysql');

// Use your mysql credentials here
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'nodeuser',
  password: '123456789',
  database: 'bamazon',
  port: 3306,  // comment this line out if you are unsure of your port number
});

connection.connect()

module.exports = connection;