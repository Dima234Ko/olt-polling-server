import { getPonForCdata } from './olt/snmp/get_pon_cdata.js';
import { getPonAndStatusCdata } from './olt/snmp/get_pon_and_status_cdata.js';
// import { getPonAndStatusEltex } from './olt/snmp/get_pon_and_status_eltex.js';
// import { getOntListEltex } from './olt/snmp/get_pon_and_status_eltex.js';
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
                    return await getNtuOnline(result, ipAddr, ponSerial);
                } else if (work === 'ntuStatusList') {
                    const result = await getPonAndStatusCdata(ipAddr);
                    return await getNtuList(result, ipAddr);
                }
            // } else if (model.Result === 'ELTE') {
            //     const result = await getOntListEltex(ipAddr);
            //     if (work === 'ntuStatus') {
            //         return await getNtuOnline(result, ipAddr, ponSerial);
            //     } else if (work === 'ntuStatusList') {
            //         return await getNtuList(result, ipAddr);
            //     }
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

        const results = await Promise.all(
            validation.ipAddresses.map(ipAddr => processIpAddress(ipAddr, ponSerial))
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

export { getStatusNtu };