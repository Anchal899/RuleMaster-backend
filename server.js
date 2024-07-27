const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ruleRoutes = require('./routes/route');
const dotenv=require('dotenv');
const cors=require('cors');

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
dotenv.config();

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://rule-master-bice.vercel.app/');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
});
const corsOptions = {
    origin: 'https://rule-master-bice.vercel.app/', // Allow requests from this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
  };
  
app.use(cors());
app.use(ruleRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
