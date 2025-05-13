const getNtuOnline = async (result, ipAddr, ponSerial) => {
    try {
        const resultStatus = result.Result.ontList.find(item => item.serial === ponSerial);

        if (resultStatus) {
            console.log(`Найдена строка с серийным номером ${ponSerial}:`, resultStatus);
            return {
                ip: ipAddr,
                success: true,
                result: resultStatus,
            };
        } else {
            console.log(`Серийный номер ${ponSerial} не найден`);
            return {
                ip: ipAddr,
                success: false,
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