import readToFile from '../readLog.js';

const getFileLog = async (req, res) => {
    try {
        const result = await readToFile();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при чтении логов: ' + error.message });
    }
};

export { getFileLog };