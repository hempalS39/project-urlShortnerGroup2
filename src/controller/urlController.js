const urlModel = require('../models/urlModel');
const shortid = require('shortid');
const validator = require('validator');

const redis = require('redis');
const { promisify } = require("util");

//creating redis client
const redisClient = redis.createClient(
    19265,
    "redis-19265.c14.us-east-1-2.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);


redisClient.auth("CSAOlSLpfR53XKWOXjwcrqUtgReTxlwC", function (err) {
  if (err) throw err;
});


redisClient.on("connect", async function () {
  console.log("Connected to Redis");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);




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
    
    //caching
    const cachedUrl = await GET_ASYNC(`${longUrl}`);
    console.log(`cachedUrl : ${cachedUrl}`)
    if (cachedUrl) {
        // const { longUrl } = JSON.parse(cachedUrl);
        return res.send(JSON.parse(cachedUrl))
    }

    
    let urlData = await urlModel.findOne({longUrl: longUrl}).select({longUrl:1, shortUrl:1, urlCode:1 ,_id :0})
    await SET_ASYNC(`${longUrl}`, JSON.stringify(urlData));
    if(urlData) return res.status(200).send({status : true , data : urlData});
    
    console.log(`urlData : ${urlData}`)

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

    console.log(`newdata : ${urlResponse}`)
    //setting urldata in caching
     await SET_ASYNC(`${longUrl}`, JSON.stringify(urlResponse));

    res.status(201).send({status : true , data : urlResponse})
    } catch (error) {
        return res.status(500).send({status : false , message : error.message})
    }
}




const getShortUrl = async (req, res) => {
    try {
        const {
            urlCode
        } = req.params;

        //finding url in cache
        const cachedUrl = await GET_ASYNC(`${urlCode}`);
        console.log(cachedUrl)
        //redirect url if found in cache
        if (cachedUrl) {
            const { longUrl } = JSON.parse(cachedUrl);
            return res.status(302).redirect(longUrl)
        }

        //finding url in database
        const url = await urlModel.findOne({urlCode});
        console.log(url)
        if (!url) {
            return res.status(404).json({
                status: false,
                message: 'URL not found',
            });
        }
        //seting url in cache
        await SET_ASYNC(`${urlCode}`, JSON.stringify(url))

        return res.status(302).redirect(JSON.parse({ longUrl: url.longUrl }))

    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}
// const getShortUrl = async function (req, res) {
//     try {
//       const { urlCode } = req.params;
  
//       // Check if the URL exists in the cache
//       let cachedUrl = await GET_ASYNC(urlCode);
//       if (cachedUrl) {
//         const { longUrl } = JSON.parse(cachedUrl);
//         // Redirect to the original URL
//         return res.redirect(longUrl);
//       }
  
//       // Find the URL document in the database
//       const url = await urlModel.findOne({ urlCode: urlCode });
  
//       if (url) {
//         // Cache the URL for 24 hours
//         await SET_ASYNC(urlCode, JSON.stringify({ longUrl: url.longUrl }), 'EX', 24 * 60 * 60);
//         // Redirect to the original URL
//         return res.redirect(url.longUrl);
//       } else {
//         // URL not found in the cache or database
//         return res.status(404).send({ error: 'URL not found' });
//       }
//     } catch (err) {
//       console.error(err);
//       return res.status(500).send({ error: 'Server Error' });
//     }
//   };
  
module.exports.shortUrl = shortUrl;
module.exports.getShortUrl = getShortUrl;
