import {getOnuInfoCdata} from './snmp/get_param_onu_cdata.js'

const getNtuOnline = async (result, ipAddr, ponSerial) => {
    try {
        const resultStatus = result.Result.ontList.find(item => item.serial === ponSerial);

        if (resultStatus) {
            console.log(`Найдена строка с серийным номером ${ponSerial}:`, resultStatus);
            const result = await getOnuInfoCdata (ipAddr, ponSerial);
            return {
                ip: ipAddr,
                foundPonSerial: true,
                result
            };
        } else {
            console.log(`Серийный номер ${ponSerial} не найден`);
            return {
                ip: ipAddr,
                foundPonSerial: false,
            };
        }
    } catch (error) {
        console.error(`Ошибка при обработке FD16 для ${ipAddr}: ${error.message}`);
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
        };
    }
};

const getNtuList = async (result, ipAddr) => {
    try {
        console.log(`Получены данные Eltex для IP-адреса ${ipAddr}:`);
        return {
            ip: ipAddr,
            ...result,
        };
    } catch (error) {
        console.error(`Ошибка при обработке ELTE для ${ipAddr}: ${error.message}`);
        return {
            ip: ipAddr,
            Success: false,
            Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
        };
    }
};


export { getNtuOnline, getNtuList };