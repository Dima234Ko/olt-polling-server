import express from 'express';
import * as controller from './ntuController.js';

const router = express.Router();

router.get('/ntuStatus', (req, res) => controller.getStatusNtu(req, res, 'ntuStatus'));
router.get('/ntuStatusList', (req, res) => controller.getStatusNtu(req, res, 'ntuStatusList'));

export default router;