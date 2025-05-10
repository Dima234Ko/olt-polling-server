const { getOntListCdata } = require('./olt/get_ntu_for_olt_cdata');
const { getLtpModel } = require('./olt/get_model_olt');

// Валидация IP-адреса
const isValidIp = (ip) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
};

const getNtu = async (req, res) => {
    try {
        // Извлекаем IP-адрес или массив IP-адресов из тела запроса
        const { ip } = req.body;

        // Проверяем, передан ли IP-адрес или массив
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP-адрес или массив IP-адресов не указан в теле запроса',
            });
        }

        // Обрабатываем как массив IP-адресов
        const ipAddresses = Array.isArray(ip) ? ip : [ip];

        // Валидация всех IP-адресов
        for (const ipAddr of ipAddresses) {
            if (!isValidIp(ipAddr)) {
                return res.status(400).json({
                    success: false,
                    error: `Некорректный формат IP-адреса: ${ipAddr}`,
                });
            }
        }

        // Параллельный вызов для всех IP-адресов
        const results = await Promise.all(
            ipAddresses.map(async (ipAddr) => {
                try {
                    // Получаем модель устройства
                    const model = await getLtpModel(ipAddr);

                    // Проверяем успешность запроса модели
                    if (!model.Success) {
                        return {
                            ip: ipAddr,
                            Success: false,
                            Result: model.Result,
                        };
                    }

                    // Проверяем, является ли модель FD16
                    if (model.Result === 'FD16') {
                        const result = await getOntListCdata(ipAddr);
                        return {
                            ip: ipAddr,
                            ...result,
                        };
                    } else {
                        return {
                            ip: ipAddr,
                            Success: false,
                            Result: `Устройство ${ipAddr} не является FD16 (модель: ${model.Result})`,
                        };
                    }
                } catch (error) {
                    return {
                        ip: ipAddr,
                        Success: false,
                        Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
                    };
                }
            })
        );

        // Отправляем успешный ответ
        return res.status(200).json({
            success: true,
            data: results,
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