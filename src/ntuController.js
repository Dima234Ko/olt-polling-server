const { getOntListCdata } = require('./olt/get_ntu_for_olt');

// Валидация IP-адреса
const isValidIp = (ip) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
};

const getNtu = async (req, res) => {
    try {
        // Извлекаем IP-адрес из тела запроса
        const ipAddress = req.body.ip;

        // Проверяем, передан ли IP-адрес
        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                error: 'IP-адрес не указан в теле запроса',
            });
        }

        // Валидация IP-адреса
        if (!isValidIp(ipAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный формат IP-адреса',
            });
        }

        // Вызываем функцию getOntListCdata
        const result = await getOntListCdata(ipAddress);

        // Отправляем успешный ответ
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        // Логирование ошибки
        console.error('Ошибка при получении данных NTU:', error);

        // Отправляем ответ с ошибкой
        return res.status(500).json({
            success: false,
            error: `Ошибка сервера: ${error.message}`,
        });
    }
};

module.exports = { getNtu };