// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const userRoutes = require('./routes/user'); // Adjust path if necessary

// Create an Express application
const app = express();
const port = 5001; 
const server = http.createServer(app);
const io = socketIo(server); // Initialize Socket.IO for real-time communication

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'client' directory
app.use(express.static('client')); // Adjust this if your front end folder is named differently

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/DeliveryApp', {})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema for MongoDB
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

// Check if User model already exists
let User;
try {
    User = mongoose.model('User');
} catch (error) {
    User = mongoose.model('User', userSchema);
}

// Predefined user: John Doe
User.findOne({ username: 'JohnDoe' }).then(user => {
    if (!user) {
        const newUser = new User({
            username: 'JohnDoe',
            email: 'john.doe@example.com',
            password: bcrypt.hashSync('yourPassword123', 10),
            role: 'admin'
        });
        newUser.save().then(() => console.log('Predefined user created'));
    }
});

// Middleware for session and passport
app.use(session({ secret: 'yourSecretKey', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username }).exec(); // Use exec() to return a promise
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return done(null, false, { message: 'Incorrect password.' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    try {
        const user = await User.findOne({ username }).exec();
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Registration route
app.post('/register', async (req, res) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email || !role) {
        return res.status(400).send('Username, password, email, and role are required.');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();
    res.redirect('/login');
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username }).exec();
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid username or password');
        }

        req.session.user = user; // Store user in session for profile access
        res.redirect('/profile'); // Redirect to profile page after login
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal server error');
    }
});

// Route to get the current user
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user.username });
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Route to update username
app.post('/api/update-username', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    const { username } = req.body;
    try {
        await User.findOneAndUpdate({ username: req.session.user.username }, { username });
        req.session.user.username = username; // Update session
        res.send('Username updated');
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).send('Internal server error');
    }
});

// Simple root route for testing
app.get('/', (req, res) => {
    res.send('Welcome to the Delivery App API');
});

// API Routes for users
app.use('/api/users', userRoutes); // Use user routes defined in users.js

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (msg) => {
        console.log('Message received:', msg);
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Port for the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
