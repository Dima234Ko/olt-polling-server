import { getPonForCdata } from './olt/snmp/get_pon_cdata.js';
import { getPonForEltex } from './olt/snmp/get_pon_eltex.js';
import { getPonAndStatusCdata } from './olt/snmp/get_pon_and_status_cdata.js';
import { getPonAndStatusEltex } from './olt/snmp/get_pon_and_status_eltex.js';
import { getLtpModel } from './olt/snmp/get_model_olt.js';
import { getNtuOnline, getNtuList } from './olt/result.js';
import { processUnsupportedModel, validateInput } from './validate.js';

const getStatusNtu = async (req, res, work) => {
    const processIpAddress = async (ipAddr, ponSerial) => {
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
                if (work === 'ntuStatus') {
                    const result = await getPonForCdata(ipAddr);
                    const onlineResult = await getNtuOnline(result, ipAddr, ponSerial, model.Result);
                    if (onlineResult.foundPonSerial === true) {
                        return onlineResult;
                    } else {
                        return { foundPonSerial: false };
                    }
                } else if (work === 'ntuStatusList') {
                    const result = await getPonAndStatusCdata(ipAddr);
                    return await getNtuList(result, ipAddr);
                }
            } else if (model.Result === 'ELTE') {
                if (work === 'ntuStatus') {
                    const result = await getPonForEltex(ipAddr);
                    const onlineResult = await getNtuOnline(result, ipAddr, ponSerial, model.Result);
                    if (onlineResult.foundPonSerial === true) {
                        return onlineResult;
                    } else {
                        return { foundPonSerial: false };
                    }
                } else if (work === 'ntuStatusList') {
                    const result = await getPonAndStatusEltex(ipAddr);
                    return await getNtuList(result, ipAddr);
                }
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
        const { ip, ponSerial } = req.body;
        const validation = validateInput(ip);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error,
            });
        }

        // Параллельная обработка всех IP-адресов
        const results = await Promise.all(
            validation.ipAddresses.map(ipAddr => processIpAddress(ipAddr, ponSerial))
        );

        // Проверка для ntuStatus: вернуть первый результат с foundPonSerial === true
        if (work === 'ntuStatus') {
            const foundResult = results.find(result => result && result.foundPonSerial === true);
            if (foundResult) {
                return res.status(200).json({
                    success: true,
                    data: foundResult,
                });
            }
        }

        // Для ntuStatusList возвращаем все результаты
        if (work === 'ntuStatusList') {
            return res.status(200).json({
                success: true,
                result: results
            });
        }

        // Если не ntuStatusList и не найден результат с foundPonSerial === true
        return res.status(200).json({
            success: false
        });

    } catch (error) {
        console.error('Ошибка при получении данных NTU:', error);
        return res.status(500).json({
            success: false,
            error: `Ошибка сервера: ${error.message}`,
        });
    }
};

export { getStatusNtu };