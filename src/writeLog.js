import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeToFile = async (message, prefix = '[INFO]') => {
    try {
        const logFilePath = path.join(__dirname, '../log.txt');
        const timestamp = new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const logEntry = `[${timestamp}] ${prefix} ${message}\n`;
        
        await fs.appendFile(logFilePath, logEntry, 'utf-8');
    } catch (error) {
        console.error('Ошибка чтения файла', error);
    }
};

export default writeToFile;