const urlModel = require('../models/urlModel');
const shortid = require('shortid');
const validator = require('validator');
const isURL = require('is-url');
require('dotenv').config();
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env

const redis = require('redis');
const { promisify } = require("util");

//creating redis client
const redisClient = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
    password: REDIS_PASSWORD
        //   { no_ready_check: true }
});

// redisClient.auth("CSAOlSLpfR53XKWOXjwcrqUtgReTxlwC", function (err) {
//   if (err) throw err;
// });

redisClient.on("connect", async function() {
    console.log("Connected to Redis");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);




function isValid(value) {
    if (value == null || value == undefined) return false;
    if (typeof value == "string" && value.trim() == "") return false;
    return true
}

// Ist api for generating shortUrl
const shortUrl = async(req, res) => {
    try {
        let longUrl = req.body.longUrl
            // Validating Url
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "pls enter url" })

        if (!isURL(longUrl)) return res.status(400).send({ status: false, msg: "not a valid longUrl" })

        if (!isValid(longUrl)) return res.status(400).send({ status: false, msg: "invalid format longUrl" })

        if (!validator.isURL(longUrl)) return res.status(400).send({ status: false, msg: "invalid longUrl" })

        // finding url data in cache 
        const cachedUrl = await GET_ASYNC(`${longUrl}`);
        if (cachedUrl) {
            return res.status(200).send({ status: true, data: JSON.parse(cachedUrl) });
        }

        //finding url data in database
        let urlData = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        if (urlData) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(urlData),
                'EX',
                24 * 60 * 60
            );

            return res.status(200).send({ status: true, data: urlData });
        }
        // console.log(`urlData : ${urlData}`)

        // creating new shortUrl
        const urlCode = shortid.generate();
        const baseUrl = "localhost:3000";
        const shortUrl = baseUrl + "/" + urlCode;

        const urlDataToSave = { longUrl, shortUrl, urlCode }
            //saving new urlData in datavase
        const savedUrl = await urlModel.create(urlDataToSave);

        //fetching urldata to be send in response & to be set in cache
        let urlResponse = {
                longUrl: savedUrl.longUrl,
                shortUrl: savedUrl.shortUrl,
                urlCode: savedUrl.urlCode
            }
            // console.log(`newdata : ${urlResponse}`)

        //setting urldata in caching
        await SET_ASYNC(`${longUrl}`, JSON.stringify(urlResponse),
            'EX',
            24 * 60 * 60
        );
        // sending url data in response if url data is created first time
        return res.status(201).send({ status: true, data: urlResponse })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




const getShortUrl = async(req, res) => {
    try {
        const {
            urlCode
        } = req.params;

        //finding url in cache
        const cachedUrl = await GET_ASYNC(`${urlCode}`);
        //if find in cache redirect longUrl 
        if (cachedUrl) {
            return res.status(302).redirect(JSON.parse(cachedUrl))
        }


        //finding url in database
        const url = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0 });
        if (!url) {
            return res.status(404).json({
                status: false,
                message: 'URL not found',
            });
        }

        //seting url in cache
        await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl),
            'EX',
            24 * 60 * 60
        )

        // redirecting longUrl
        return res.status(302).redirect(url.longUrl)

    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}

module.exports.shortUrl = shortUrl;
module.exports.getShortUrl = getShortUrl;