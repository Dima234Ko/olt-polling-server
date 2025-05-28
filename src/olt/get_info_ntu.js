
import {filterLists} from './work_data.js';
import writeToFile from './../writeLog.js';
import {getReceivedOpticalPowers} from './snmp/get_RX_power.js';
import {getParam} from './snmp/get_param_onu.js'


const getOnuInfo = async (param) => {
    
    const {ipAddr, ponSerial, oid, model} = param;

    try {
        const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');
        await writeToFile('Получена информация о pon serial');

        const statusList = await getParam(ipAddr, oid.runStateOid, model.Result, 'runState');
        await writeToFile('Получена информация о status');

        const softList = await getParam(ipAddr, oid.softwareVersionOid, model.Result, 'softwareVersion');
        await writeToFile('Получена информация о software versions');

        const data = await filterLists({ponList, statusList, softList, ponSerial, model});
        
            if (ponSerial){
            if (!data?.id) {
                return false;
            }

            const rxList = await getReceivedOpticalPowers(ipAddr, data.id, oid.receivedPowerOid, model.Result);
            await writeToFile('Получена информация о optical power');

            if (rxList?.Result?.receivedOpticalPower) {
                data.receivedOpticalPower = rxList.Result.receivedOpticalPower;
            } else {
                writeToFile('Данные об оптической мощности не получены', '[FAIL]');
            }
        }
            
        return data;

    } catch (error) {
        await writeToFile(`Ошибка при получении данных: ${error.message}`, '[FAIL]');
        throw error;
    }
};

export { getOnuInfo };