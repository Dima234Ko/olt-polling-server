import {getOnuInfoCdata} from './snmp/get_param_onu_cdata.js'
import {getOnuInfoEltex} from './snmp/get_param_onu_eltex.js'
import writeToFile from '../writeLog.js';

const getNtuOnline = async (result, ipAddr, ponSerial, model) => {
    try {
        const resultStatus = result.Result.find(item => item.serial === ponSerial);
        if (resultStatus) {
            await writeToFile(`NTU ${ponSerial} найдена на olt ${model} ${ipAddr}`, '[SUCCESS]');

            if (model === 'FD16') {
                const result = await getOnuInfoCdata (ipAddr, ponSerial);
                if (result){
                    return {
                        ...result,
                        ip: ipAddr,
                        foundPonSerial: true
                    };
                }
            } else if (model === 'ELTE') {
                const result = await getOnuInfoEltex (ipAddr, ponSerial);
                if (result){
                    return {
                        ...result,
                        ip: ipAddr,
                        foundPonSerial: true
                    };
                }
            }
        } else {
            writeToFile(`NTU ${ponSerial} не найдена на olt`);
            return {
                ip: ipAddr,
                foundPonSerial: false,
            };
        }
    } catch (error) {
        console.error(`Ошибка при опросе ${ipAddr}: ${error.message}`);
        writeToFile(`Ошибка при опросе ${ipAddr}: ${error.message}`, '[FAIL]');
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при опросе ${ipAddr}: ${error.message}`,
        };
    }
};

const getNtuList = async (result, ipAddr) => {
    try {
        writeToFile(`Получены данные для IP-адреса ${ipAddr}:`);
        return {
            ip: ipAddr,
            ...result,
        };
    } catch (error) {
        console.error(`Ошибка при опросе ${ipAddr}: ${error.message}`, '[FAIL]');
        writeToFile(`Ошибка при опросе ${ipAddr}: ${error.message}`);
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
        };
    }
};


export { getNtuOnline, getNtuList };