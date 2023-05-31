const urlModel = require('../models/urlModel');
const shortid = require('shortid');
const validator = require('validator');


function isValid(value) {
    if(typeof longUrl == "string" && longUrl.trim().length == 0) return false;
    return true
}


const shortUrl = async (req , res) => {
    let data = req.body

    if(Object.keys(data).length == 0) return res.status(400).send({status : false , message : "pls enter url"})

    // if(isValid(data.longUrl)) return res.status(400).send({status : false , msg : "invalid format longUrl"})

    if(!validator.isURL(data.longUrl)) return res.status(400).send({status : false , msg : "invalid longUrl"})
    
    console.log(data.longUrl)

    const {longUrl} = data;

    const urlCode = shortid.generate();
    const baseUrl = "localhost:3000" ;
    const shortUrl = baseUrl + "/" + urlCode ;

    const result = {urlCode ,longUrl, shortUrl }

    const savedUrl = await urlModel.create(result)

    res.status(201).send({status : true , data : savedUrl})
}

module.exports.shortUrl = shortUrl;