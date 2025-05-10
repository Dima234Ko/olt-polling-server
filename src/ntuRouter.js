const express = require('express');
const controller = require('./ntuController');

const router = express.Router();

router.get('/ntuStatus', controller.getNtu);

module.exports = router;