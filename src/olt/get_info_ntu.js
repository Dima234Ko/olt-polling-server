
import {filterLists, processingСonfigState} from './work_data.js';
import writeToFile from './../writeLog.js';
import {getParam, getOneParam} from './snmp/get_param_onu.js'


const getOnuInfo = async (param) => {
    
    const {ipAddr, ponSerial, oid, model} = param;

    
    try {
        const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');
        await writeToFile('Получена информация о pon serial');

        const statusList = await getParam(ipAddr, oid.runStateOid, model.Result, 'runState');
        await writeToFile('Получена информация о status');

        const softList = await getParam(ipAddr, oid.softwareVersionOid, model.Result, 'softwareVersion');
        await writeToFile('Получена информация о software versions');

        const downCase = await getParam(ipAddr, oid.downCase, model.Result, 'downCase');
        await writeToFile('Получена информация о downCase');

        const data = await filterLists({ponList, statusList, softList, ponSerial, downCase, model});
        
        if (ponSerial){
            if (!data?.id) {
                return false;
            }

            const rxList = await getOneParam(ipAddr, data.id, oid.receivedPowerOid, model.Result, 'receivedOpticalPower');
            await writeToFile('Получена информация о optical power');

            if (rxList?.Result?.receivedOpticalPower) {
                data.receivedOpticalPower = rxList.Result.receivedOpticalPower;
            } else {
                writeToFile('Данные об оптической мощности не получены', '[FAIL]');
            }
            
            const configState = await getOneParam(ipAddr, data.id, oid.configState, model.Result, 'configState');
            await writeToFile('Получена информация о config state');
            
            if (configState?.Result?.configState) {
                let configStateByText = await processingСonfigState(configState.Result.configState, model.Result);
                data.configState = configStateByText;
            } else {
                writeToFile('Данные о статусе конфигурации не получены', '[FAIL]');
            }
            
        }
            
        return data;

    } catch (error) {
        await writeToFile(`Ошибка при получении данных: ${error.message}`, '[FAIL]');
        throw error;
    }
};

export { getOnuInfo };