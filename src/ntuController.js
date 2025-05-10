const { getOntListCdata } = require('./olt/get_ntu_for_olt_cdata');
const { getOntListEltex } = require('./olt/get_ont_list_eltex');
const { getLtpModel } = require('./olt/get_model_olt');

// Валидация IP-адреса
const isValidIp = (ip) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
};
const getNtu = async (req, res) => {
    try {
        const { ip } = req.body;

        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP-адрес или массив IP-адресов не указан в теле запроса',
            });
        }

        const ipAddresses = Array.isArray(ip) ? ip : [ip];

        for (const ipAddr of ipAddresses) {
            if (!isValidIp(ipAddr)) {
                return res.status(400).json({
                    success: false,
                    error: `Некорректный формат IP-адреса: ${ipAddr}`,
                });
            }
        }

        const results = await Promise.all(
            ipAddresses.map(async (ipAddr) => {
                try {
                    console.log(`Обработка IP-адреса: ${ipAddr}`);

                    const model = await getLtpModel(ipAddr);
                    console.log(`Получена модель для IP-адреса ${ipAddr}: ${model.Result}`);

                    if (!model.Success) {
                        return {
                            ip: ipAddr,
                            Success: false,
                            Result: model.Result,
                        };
                    }

                    if (model.Result === 'FD16') {
                        const result = await getOntListCdata(ipAddr);
                        console.log(`Получены данные Cdata для IP-адреса ${ipAddr}:`);
                        return {
                            ip: ipAddr,
                            ...result,
                        };
                    } else if (model.Result === 'ELTE') {
                        const result = await getOntListEltex(ipAddr);
                        console.log(`Получены данные Eltex для IP-адреса ${ipAddr}:`);
                        return {
                            ip: ipAddr,
                            ...result,
                        };
                    } else {
                        return {
                            ip: ipAddr,
                            Success: false,
                            Result: `Устройство ${ipAddr} не поддерживается (модель: ${model.Result})`,
                        };
                    }
                } catch (error) {
                    console.error(`Ошибка при обработке ${ipAddr}: ${error.message}`);
                    return {
                        ip: ipAddr,
                        Success: false,
                        Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
                    };
                }
            })
        );

        return res.status(200).json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('Ошибка при получении данных NTU:', error);
        return res.status(500).json({
            success: false,
            error: `Ошибка сервера: ${error.message}`,
        });
    }
};


module.exports = { getNtu };