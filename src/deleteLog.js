import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import writeToFile from './writeLog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const deleteOldLogs = async (logFilePath) => {
    try {
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() -  5 * 60 * 1000);
        const fileContent = await fs.readFile(logFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const parseLogDate = (line) => {
            const match = line.match(/\[(\d{2}\.\d{2}\.\d{4}), (\d{2}:\d{2}:\d{2})\]/);
            if (match) {
                const [_, date, time] = match;
                const [day, month, year] = date.split('.').map(Number);
                const [hours, minutes, seconds] = time.split(':').map(Number);
                return new Date(year, month - 1, day, hours, minutes, seconds);
            }
            return null;
        };

        const recentLines = lines.filter(line => {
            const logDate = parseLogDate(line);
            return logDate && logDate >= fiveDaysAgo;
        });

        if (recentLines.length > 0) {
            await fs.writeFile(logFilePath, recentLines.join('\n') + '\n', 'utf-8');
        } else {
            await fs.writeFile(logFilePath, '', 'utf-8');
        }
    } catch (error) {
        return error;
    }
};

const runDeleteOldLogsCyclically = async () => {
    const delay = 5 * 60 * 1000;
    const filePath = path.join(__dirname, '../log.txt');

    const run = async () => {
        try {
            await deleteOldLogs(filePath);
            await writeToFile('Успешная очистка логов');
            setTimeout(run, delay);
        } catch (error) {
            await writeToFile(`Ошибка очистки логов: ${error}`, '[FAIL]');
            console.error('Ошибка очистки логов:', error);
            setTimeout(run, delay);
        }
    };

    run();
};

export default runDeleteOldLogsCyclically;