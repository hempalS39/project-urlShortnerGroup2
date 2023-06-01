const urlModel = require('../models/urlModel');
const shortid = require('shortid');
const validator = require('validator');


function isValid(value) {
    if(typeof value == "string" && value.trim() == "") return false;
    return true
}


const shortUrl = async (req , res) => {
    try {
        let longUrl = req.body.longUrl

    if(Object.keys(req.body).length == 0) return res.status(400).send({status : false , message : "pls enter url"})
    
    if(!isValid(longUrl)) return res.status(400).send({status : false , msg : "invalid format longUrl"})

    if(!validator.isURL(longUrl)) return res.status(400).send({status : false , msg : "invalid longUrl"})
    
    // console.log(data.longUrl)

    let urlData = await urlModel.findOne({longUrl: longUrl}).select({longUrl:1, shortUrl:1, urlCode:1 ,_id :0})
    if(urlData) return res.status(200).send({status : true , data : urlData});
    
    const urlCode = shortid.generate();
    const baseUrl = "localhost:3000" ;
    const shortUrl = baseUrl + "/" + urlCode ;

    const urlDataToSave = {longUrl, shortUrl, urlCode }

    const savedUrl =  await urlModel.create(urlDataToSave)

    let urlResponse = {
        longUrl : savedUrl.longUrl,
        shortUrl: savedUrl.shortUrl,
        urlCode : savedUrl.urlCode
    } 
     
    res.status(201).send({status : true , data : urlResponse})
    } catch (error) {
        return res.status(500).send({status : false , message : error.message})
    }
}

const getShortUrl = async function (req , res) {
    try {
        let urlCode = req.params.urlCode;

        if(!urlCode) return res.status(400).send({status : false , msg : "invalid format longUrl"});
    
        let urldata = await urlModel.findOne({urlCode :urlCode});
        if(!urldata) return res.status(400).send({status : false , msg : "urldata data not found"});
    
        let longUrl = urldata.longUrl;
    
        res.status(302).redirect(longUrl);
        
    } catch (error) {
        return res.status(500).send({status : false , message : error.message})
    }
}

module.exports.shortUrl = shortUrl;
module.exports.getShortUrl = getShortUrl;
