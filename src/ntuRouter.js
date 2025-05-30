import express from 'express';
import * as ntuController from './controller/ntuController.js';
import * as fileController from './controller/fileController.js';
import writeToFile from './writeLog.js';

const router = express.Router();

router.post('/ntuStatus', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatus');
    ntuController.getStatusNtu(req, res, 'ntuStatus');
});

router.post('/ntuStatusList', async (req, res) => {
    await writeToFile('Вызван маршрут: /ntuStatusList');
    ntuController.getStatusNtu(req, res, 'ntuStatusList');
});

router.post('/resetNtu', async (req, res) => {
    await writeToFile('Вызван маршрут: /resetNtu');
    ntuController.getResetNtu(req, res, 'resetNtu');
});

router.post('/readLog', async (req, res) => {
    await writeToFile('Вызван маршрут: /readLog');
    fileController.getFileLog(req, res, 'ntuStatusList');
});

export default router;