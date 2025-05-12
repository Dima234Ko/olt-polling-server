const express = require('express');
const controller = require('./ntuController');

const router = express.Router();

router.get('/ntuStatus', (req, res) => controller.getStatusNtu(req, res, 'ntuStatus'));
router.get('/ntuStatusList', (req, res) => controller.getStatusNtu(req, res, 'ntuStatusList'));

module.exports = router;