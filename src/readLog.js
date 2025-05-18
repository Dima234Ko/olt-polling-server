import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function parseLogFile() {
    try {
        const logFilePath = path.join(__dirname, '../log.txt');
        const logContent = await fs.readFile(logFilePath, 'utf8');
        const lines = logContent.trim().split('\n');
        const result = lines.map(line => {
            const match = line.match(/\[(.+?)\]\s*\[(\w+)\]\s*(.+)/);
            if (match) {
                return {
                    date: match[1],
                    type: match[2],
                    info: match[3]
                };
            }
            return null;
        }).filter(item => item !== null);
        
        return result;
    } catch (error) {
        console.error(`Ошибка при чтении файла: ${error.message}`);
        throw new Error(`Не удалось прочитать лог-файл: ${error.message}`);
    }
}

export default parseLogFile;