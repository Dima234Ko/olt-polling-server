import {getOnuInfo} from './get_info_ntu.js';
import writeToFile from '../writeLog.js';

const getNtuOnline = async (param) => {
    
    const {ponList, ipAddr, ponSerial, model, oid} = param;
    
    try {
        const resultStatus = ponList.Result.find(item => item.serial === ponSerial);
        if (resultStatus) {
            await writeToFile(`NTU ${ponSerial} найдена на olt ${model.Result} ${ipAddr}`, '[SUCCESS]');

            const result = await getOnuInfo ({ponList, ipAddr, ponSerial, oid, model});
            if (result){
                return {
                    ...result,
                    ip: ipAddr,
                    foundPonSerial: true
                };
            }
            
        } else {
            writeToFile(`NTU ${ponSerial} не найдена на OLT ${ipAddr}`);
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

const getNtuList = async (param) => {
    
    const {ponList, ipAddr, model, oid} = param;
    
    try {
            const result = await getOnuInfo ({ponList, ipAddr, ponSerial:false, oid, model});
            if (result){
                return {
                    ip: ipAddr,
                    model: model.Result,
                    ntuList: result
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


export { getNtuOnline, getNtuList };