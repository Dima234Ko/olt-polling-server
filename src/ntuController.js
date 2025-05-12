const { getOntListCdata } = require('./olt/snmp/get_ntu_for_olt_cdata');
const { getOntListEltex } = require('./olt/snmp/get_ont_list_eltex');
const { getLtpModel } = require('./olt/snmp/get_model_olt');
const { getNtuOnline } = require('./olt/result');
const { getNtuList } = require('./olt/result');
const { processUnsupportedModel } = require('./validate');
const { validateInput } = require('./validate');


// Основная функция обработки запроса
const getNtu = async (req, res) => {

    const processIpAddress = async (ipAddr) => {
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
                return await getNtuOnline(result, ipAddr);
            } else if (model.Result === 'ELTE') {
                const result = await getOntListEltex(ipAddr);
                return await getNtuOnline(result, ipAddr);
            } else {
                return processUnsupportedModel(ipAddr, model.Result);
            }
        } catch (error) {
            console.error(`Ошибка при обработке ${ipAddr}: ${error.message}`);
            return {
                ip: ipAddr,
                Success: false,
                Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
            };
        }
    };

    try {
        const { ip } = req.body;
        const validation = validateInput(ip);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error,
            });
        }

        const results = await Promise.all(
            validation.ipAddresses.map(processIpAddress)
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