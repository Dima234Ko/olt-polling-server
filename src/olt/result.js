import {getOnuInfoCdata} from './snmp/get_param_onu_cdata.js'
import {getOnuInfoEltex} from './snmp/get_param_onu_eltex.js'

const getNtuOnline = async (result, ipAddr, ponSerial, model) => {
    try {
        const resultStatus = result.Result.find(item => item.serial === ponSerial);
        if (resultStatus) {
            console.log(`NTU: ${ponSerial} найдена`, resultStatus);

            if (model === 'FD16') {
                const result = await getOnuInfoCdata (ipAddr, ponSerial);
                if (result){
                    return {
                        ip: ipAddr,
                        foundPonSerial: true,
                        result
                    };
                }
            } else if (model === 'ELTE') {
                const result = await getOnuInfoEltex (ipAddr, ponSerial);
                if (result){
                    return {
                        ip: ipAddr,
                        foundPonSerial: true,
                        result
                    };
                }
            }
        } else {
            console.log(`NTU ${ponSerial} не найдена на сети`);
            return {
                ip: ipAddr,
                foundPonSerial: false,
            };
        }
    } catch (error) {
        console.error(`Ошибка при опросе ${ipAddr}: ${error.message}`);
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при опросе ${ipAddr}: ${error.message}`,
        };
    }
};

const getNtuList = async (result, ipAddr) => {
    try {
        console.log(`Получены данные для IP-адреса ${ipAddr}:`);
        return {
            ip: ipAddr,
            ...result,
        };
    } catch (error) {
        console.error(`Ошибка при обработке данных для ${ipAddr}: ${error.message}`);
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
        };
    }
};


export { getNtuOnline, getNtuList };