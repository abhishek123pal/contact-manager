const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({origin:'*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));
app.use(express.json()); // Middleware to parse JSON

// 1. Connect to MongoDB (Replace with your URI or local db)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Cloud MongoDB Connected"))
  .catch(err => console.log("❌ Connection error",err));

//user schema
  const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);
// 2. Define Schema
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: String,
  date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
//starting
//---[new section:Auth MIDDLEWARE]
const auth =(req,res,next)=> {
  const token =req.header('x-auth-token');
  if(!token) return res.status(401).json({msg:"No token,authorization denied"});

  try{
    const decoded =jwt.verify(token,process.env.JWT_SECRET);
    req.user= decoded.userId;
    next();

  }
  catch(e){
    res.status(400).json({msg: "Token is not valid"});
  }
};
// 3. API Routes
// --- [NEW SECTION: AUTH ROUTES] ---
// 3. AUTHENTICATION ROUTES (Public)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Hash the password so it's not saved as plain text
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Create a Token that expires in 1 hour
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CONTACT ROUTES (Protected - added 'auth' middleware)
// Now only logged-in users can add contacts
app.post('/api/contacts', auth, async (req, res) => {
  try {
    const newContact = new Contact({
      ...req.body,
      userId: req.user // Attach the ID of the logged-in user
    });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Now only shows contacts belonging to the logged-in user
app.get('/api/contacts', auth, async (req, res) => {
  const contacts = await Contact.find({ userId: req.user }).sort({ date: -1 });
  res.json(contacts);
});

app.delete('/api/contacts/:id', auth, async (req, res) => {
  try {
    // Ensure the user deleting the contact actually owns it
    await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user });
    res.json({ message: "Contact removed" });
  } catch (err) {
    res.status(500).send(err);
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));