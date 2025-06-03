
import {filterLists, processingСonfigState} from './work_data.js';
import writeToFile from './../writeLog.js';
import {getParam, getOneParam} from './snmp/get_param_onu.js'


const getOnuInfo = async (param) => {
    
    const {ipAddr, ponSerial, oid, model, ponList} = param;

    
    try {
        const statusList = await getParam(ipAddr, oid.runStateOid, model.Result, 'runState');
        await writeToFile(`Получена информация о status OLT ${ipAddr}`);

        const softList = await getParam(ipAddr, oid.softwareVersionOid, model.Result, 'softwareVersion');
        await writeToFile(`Получена информация о software versions OLT ${ipAddr}`);

        const downCase = await getParam(ipAddr, oid.downCase, model.Result, 'downCase');
        await writeToFile(`Получена информация о downCase OLT ${ipAddr}`);

        const data = await filterLists({ponList, statusList, softList, ponSerial, downCase, model});
        
        if (ponSerial){
            if (!data?.id) {
                return false;
            }

            const rxList = await getOneParam(ipAddr, data.id, oid.receivedPowerOid, model.Result, 'receivedOpticalPower');
            await writeToFile(`Получена информация о optical power OLT ${ipAddr}`);

            if (rxList?.Result?.receivedOpticalPower) {
                data.receivedOpticalPower = rxList.Result.receivedOpticalPower;
            } else {
                writeToFile(`Данные об оптической мощности не получены OLT ${ipAddr}`, '[FAIL]');
            }
            
            const configState = await getOneParam(ipAddr, data.id, oid.configState, model.Result, 'configState');
            await writeToFile(`Получена информация о config state OLT ${ipAddr}`);
            
            if (configState?.Result?.configState) {
                let configStateByText = await processingСonfigState(configState.Result.configState, model.Result);
                data.configState = configStateByText;
            } else {
                writeToFile(`Данные о статусе конфигурации не получены OLT ${ipAddr}`, '[FAIL]');
            }
            
        }
            
        return data;

    } catch (error) {
        await writeToFile(`Ошибка при получении данных: ${error.message}`, '[FAIL]');
        throw error;
    }
};

export { getOnuInfo };