import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writeToFile(log) {
    const filePath = path.join(__dirname, '../log.txt');
    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }); 
    const logWithTimestamp = `[${timestamp}] ${log}\n`;
    try {
        await fs.writeFile(filePath, logWithTimestamp, { encoding: 'utf8', flag: 'a' });
        return { success: true, message: `Данные записаны в ${filePath}` };
    } catch (error) {
        console.error(`Ошибка при записи в файл ${filePath}: ${error.message}`);
    }
}

export default writeToFile;