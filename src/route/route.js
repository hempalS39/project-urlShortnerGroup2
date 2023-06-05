const express = require("express");
const router = express.Router();
const {shortUrl , getShortUrl} = require('../controller/urlController')
// const {shortUrl ,getShortUrl} = require('../controller/url');



router.post('/url/shorten' ,shortUrl );

router.get('/:urlCode' , getShortUrl)


module.exports = router