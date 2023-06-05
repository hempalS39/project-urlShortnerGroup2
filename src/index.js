const express = require("express");
const app = express();
const route = require('./route/route')
const mongoose = require("mongoose");

require('dotenv').config();

const { PORT, MONGODB_URL } = process.env


app.use(express.json());
app.use(express.urlencoded({extended : true}))


mongoose.connect(MONGODB_URL , {
    useNewUrlParser : true,
    useUnifiedTopology : true
}).then(() => console.log("mongoDB connected"))
    .catch(err => console.log(err));


app.use('/' , route);

app.listen(PORT , () => {
    console.log(`server running on port ${PORT}`)
})




