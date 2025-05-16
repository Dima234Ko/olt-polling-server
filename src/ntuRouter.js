import express from 'express';
import * as controller from './ntuController.js';
import writeToFile from './writeLog.js';

const router = express.Router();

router.get('/ntuStatus', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatus'); 
    controller.getStatusNtu(req, res, 'ntuStatus');
});

router.get('/ntuStatusList', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatusList');
    controller.getStatusNtu(req, res, 'ntuStatusList');
});

export default router;