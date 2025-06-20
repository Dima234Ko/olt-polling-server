import { promises as fs } from 'fs';
import { join } from 'path';

async function findFrontSvenFolder(startDir = process.platform === 'win32' ? 'C:\\' : '/') {
    const foundPaths = []; // Массив для хранения путей к папкам front_sven

    async function searchDir(currentDir) {
        try {
            const files = await fs.readdir(currentDir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = join(currentDir, file.name);

                if (file.isDirectory()) {
                    if (file.name === 'front_sven') {
                        foundPaths.push(fullPath);
                    }
                    // Рекурсивно ищем в поддиректориях
                    await searchDir(fullPath);
                }
            }
        } catch (err) {
            // Игнорируем ошибки доступа или чтения
            if (err.code === 'EACCES' || err.code === 'ENOENT') {
                console.warn('Skipping directory due to access error:', currentDir);
                return;
            }
            console.error('Error reading directory:', currentDir, err.message);
        }
    }

    await searchDir(startDir);
    return foundPaths; // Возвращаем массив найденных путей
}

export async function createClockFileInFrontSven(startDir = process.platform === 'win32' ? 'E:\\' : '/') {
    // Получаем все папки front_sven
    const frontSvenFolders = await findFrontSvenFolder(startDir);

    const createdFiles = []; // Массив для хранения путей к созданным файлам

    // Создаём файл clock.txt в каждой папке front_sven
    for (const folderPath of frontSvenFolders) {
        const clockFilePath = join(folderPath, 'time.txt');

        try {
            await fs.writeFile(clockFilePath, '1000');
            console.log('Created clock.txt in:', folderPath);
            createdFiles.push(clockFilePath);
        } catch (err) {
            console.warn('Failed to create clock.txt in:', folderPath, err.message);
        }
    }

    return createdFiles; // Возвращаем массив путей к созданным файлам
}