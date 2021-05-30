const express = require('express')
const app = express()
const pool = require('./db')
const cors = require('cors')
const bcrypt = require('bcrypt')
const stripe = require('stripe')('sk_test_51IvyUYA2kpe3q8neCFvqVDg4M3bFovtBmOgG3dt8dYXLhgwnvjMkez7ZMhO8LtyWx2caP68TR8O8QRKJLDJd5vWA00wOT3e3xs');

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

//ROUTES//

app.get('/users', (req, res) => {
    res.json(arr)
})

//create a user

app.post('/register', async (req, res) => {
    const query = await pool.query('SELECT email FROM users WHERE email = $1', [req.body.email])

    const exist = ((query.rows).map(({ email }) => email)).toString()
    const hashedPassword = await bcrypt.hash(req.body.password, 12)
    const users = [req.body.email, req.body.username, hashedPassword]
    console.log(req.body.username)
    if (exist === req.body.email) {
        res.status(400).send(console.log('User with this email already exists'))
    } else {
        try {
        const createUser = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *', users)
            res.json(createUser.rows[0])
        } catch(err) {
            res.status(500).send(err.message)
        }
    }
})

//login a user

app.post('/login', async (req, res) => {
    const query = await pool.query('SELECT email FROM users WHERE email = $1', [req.body.email])
    const query_two = await pool.query('SELECT password FROM users WHERE email = $1', [req.body.email])
    const query_three = await pool.query('SELECT username FROM users WHERE email = $1', [req.body.email])
    const exist = ((query.rows).map(({ email }) => email)).toString()
    const compare = ((query_two.rows).map(({ password }) => password)).toString()
    const username = ((query_three.rows).map(({ username }) => username)).toString()
    console.log(username)

    if (exist !== req.body.email) {
        return res.status(400).send('User does not exist with this email')
    } else if (username !== req.body.username) {
        return res.status(401).send('User does not exist with this username') 
    } else {
        try {
            if (await bcrypt.compare(req.body.password, compare)) {
                res.status(201).send('Login Successful')
            } else {
                res.status(404).send("User with this password doesn't exist")
            }
        } catch(err) {
            res.status(500).send(err.message)
        }
    }
})

//create product

app.post('/create-product', async (req, res) => {
    try {
        await stripe.products.create({
            name: req.body.name
        })
        res.status(201).send('Product Created')
        console.log(res.statusCode)
        console.log(res.statusMessage)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

//delete product

app.post('/delete-product', async (req, res) => {
    try {
        await stripe.products.del(
            req.body.name
        )
        console.log(res.statusCode)
        console.log(res.statusMessage)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

//create price for product

app.post('/create-product/price', async (req, res) => {
    try {
        await stripe.prices.create({
            product: req.body.name,
            currency: 'usd',
            unit_amount: req.body.price,
            recurring: {interval: req.body.recurring}
        })
        res.status(201).send('Price Created')
        console.log(res.statusCode)
        console.log(res.statusMessage)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

//checkout session



//create a subsciption

app.post('/create-subscription', async (req, res) => {
    const customer_email = await pool.query('SELECT email FROM users WHERE username = $1', [req.body.username])
    try{
        await stripe.customers.create({ email: customer_email });
        res.status(201).send('Customer Created');
        console.log(res)
    } catch (err) {
        res.status(500).send(err.message)
    }
  // save the customer.id as stripeCustomerId
  // in your database.

  
});

//only allow certain people to access this piece of the website

app.listen(5000, () => {console.log('server has started on port 5000')})