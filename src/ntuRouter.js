import express from 'express';
import * as ntuController from './controller/ntuController.js';
import * as fileController from './controller/fileController.js';
import writeToFile from './writeLog.js';

const router = express.Router();

router.get('/ntuStatus', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatus');
    ntuController.getStatusNtu(req, res, 'ntuStatus');
});

router.get('/ntuStatusList', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatusList');
    ntuController.getStatusNtu(req, res, 'ntuStatusList');
});

router.get('/readLog', async (req, res) => {
    await writeToFile('Вызван маршрут: /readLog');
    fileController.getFileLog(req, res, 'ntuStatusList');
});

export default router;