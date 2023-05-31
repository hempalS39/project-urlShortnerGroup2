const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const route = require('./route/route')
const mongoose = require("mongoose");

app.use(express.json());
app.use(express.urlencoded({extended : true}))


mongoose.connect("mongodb+srv://jhahimanshu966:r60NssUKoV98Qmu6@cluster0.cxjklte.mongodb.net/group2Database" , {
    useNewUrlParser : true,
    useUnifiedTopology : true
}).then(() => console.log("mongoDB connected"))
    .catch(err => console.log(err));


app.use('/' , route);

app.listen(port , () => {
    console.log(`server running on port ${port}`)
})




// mongodb+srv://functionup-radon:emE3iyVTUPWqSmGf@cluster0.1xlecsc.mongodb.net/group2Database?retryWrites=true&w=majority