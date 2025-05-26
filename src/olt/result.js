import {getOnuInfo} from './snmp/get_param_onu.js'
import {get_oid_olt_cdata, get_oid_olt_eltex} from './snmp/get_oid.js'
import writeToFile from '../writeLog.js';

const getNtuOnline = async (result, ipAddr, ponSerial, model) => {
    try {
        const resultStatus = result.Result.find(item => item.serial === ponSerial);
        if (resultStatus) {
            await writeToFile(`NTU ${ponSerial} найдена на olt ${model} ${ipAddr}`, '[SUCCESS]');

            let oid;

            if (model === 'FD16') {
                oid = get_oid_olt_cdata();
            } else if (model === 'ELTE') {
                oid = get_oid_olt_eltex();
            }


            const result = await getOnuInfo (ipAddr, ponSerial, oid, model);
            if (result){
                return {
                    ...result,
                    ip: ipAddr,
                    foundPonSerial: true
                };
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