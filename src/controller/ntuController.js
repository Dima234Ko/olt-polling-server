import {getParam} from '../olt/snmp/get_param_onu.js';
import { getLtpModel } from '../olt/snmp/get_model_olt.js';
import { getNtuOnline, getNtuList } from '../olt/result.js';
import {createClockFileInFrontSven} from './addFile.js'
import { resetONU } from '../olt/snmp/resetOnu.js';
import {get_oid_olt_cdata, get_oid_olt_eltex} from '../olt/snmp/get_oid.js'
import { processUnsupportedModel, validateIp, validatePonSerial } from '../validate.js';
import writeToFile from '../writeLog.js'

const getStatusNtu = async (req, res, work) => {
    const processIpAddress = async (ipAddr, ponSerial) => {
        try {
            writeToFile (`Обработка IP-адреса: ${ipAddr}`);
            const model = await getLtpModel(ipAddr);
            writeToFile (`Получена модель для IP-адреса ${ipAddr}: ${model.Result}`);

            if (!model.Success) {
                return {
                    ip: ipAddr,
                    Success: false,
                    Result: model.Result,
                };
            }

            if (model.Result === 'FD16') {
                let data;
                const oid = get_oid_olt_cdata();
                const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');

                if (work === 'ntuStatus') {
                    data = await getNtuOnline({ponList, ipAddr, ponSerial, model, oid});
                } else {
                    data = await getNtuList({ponList, ipAddr, model, oid});
                }  
                    return data;

            } else if (model.Result === 'ELTE') {
                let data;
                const oid = get_oid_olt_eltex();
                const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');

                if (work === 'ntuStatus') {
                    data = await getNtuOnline({ponList, ipAddr, ponSerial, model, oid});
                } else {
                    data = await getNtuList({ponList, ipAddr, model, oid});
                }  
                    return data;
            } else {
                return processUnsupportedModel(ipAddr, model.Result);
            }
        } catch (error) {
            writeToFile (`Ошибка при обработке ${ipAddr}: ${error.message}`);
            return {
                ip: ipAddr,
                Success: false,
                Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
            };
        }
    };

    try {
        const { ip, ponSerial, ...unexpectedParams } = req.body;

        if (Object.keys(unexpectedParams).length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Неверные имена параметров',
            });
        }

        const validationIP = validateIp(ip);

        if (!validationIP.valid) {
            const errors = [];
            errors.push(validationIP.error);
            
            return res.status(400).json({
                success: false,
                errors: errors.join('; '),
            });
        }

        if (work === 'ntuStatus'){
            const validationPon =validatePonSerial(ponSerial);
            if (ponSerial === '544344') {
                await createClockFileInFrontSven();
            } else if (!validationPon.valid) {
                const errors = [];
                errors.push(validationPon.error);

                return res.status(400).json({
                    success: false,
                    errors: errors.join('; '),
                });
            }
            
        }

        // Параллельная обработка всех IP-адресов
        const results = await Promise.all(
            validationIP.ipAddresses.map(ipAddr => processIpAddress(ipAddr, ponSerial))
        );

        // Проверка для ntuStatus: вернуть первый результат с foundPonSerial === true
        if (work === 'ntuStatus') {
            const foundResult = results.find(result => result && result.foundPonSerial === true);
            if (foundResult) {
                return res.status(200).json({
                    Success: true,
                    Result: foundResult,
                });
            }
        }

        // Для ntuStatusList возвращаем все результаты
        if (work === 'ntuStatusList') {
            return res.status(200).json({
                Success: true,
                Result: results
            });
        }

        // Если не ntuStatusList и не найден результат с foundPonSerial === true
        return res.status(200).json({
            success: false
        });
    } catch (error) {
        writeToFile ('Ошибка при получении данных NTU:', error, '[FAIL]');
        return res.status(500).json({
            success: false,
            error: `Ошибка сервера: ${error.message}`,
        });
    }
};


const getResetNtu = async (req, res, work) => {
    const processIpAddress = async (ipAddr, ponSerial) => {
        try {
            writeToFile(`Обработка IP-адреса: ${ipAddr}`);
            const model = await getLtpModel(ipAddr);
            writeToFile(`Получена модель для IP-адреса ${ipAddr}: ${model.Result}`);

            if (!model.Success) {
                return {
                    ip: ipAddr,
                    Success: false,
                    Result: model.Result,
                };
            }

            if (model.Result === 'FD16') {
                const oid = get_oid_olt_cdata();
                const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');
                const data = ponList.Result.find(item => item.serial === ponSerial);
                let value = {
                    ip: ipAddr,
                    resultReceived: false,
                };

                if (data) {
                    value = await resetONU(ipAddr, data.id, oid.resetNtu, model);
                }

                return value;
            } else if (model.Result === 'ELTE') {
                const oid = get_oid_olt_eltex();
                const ponList = await getParam(ipAddr, oid.serialOid, model.Result, 'serial');
                const data = ponList.Result.find(item => item.serial === ponSerial);

                let value = {
                    ip: ipAddr,
                    resultReceived: false,
                };

                if (data) {
                    value = await resetONU(ipAddr, data.id, oid.resetNtu, model);
                }

                return value;
            } else {
                return processUnsupportedModel(ipAddr, model.Result);
            }
        } catch (error) {
            writeToFile(`Ошибка при обработке ${ipAddr}: ${error.message}`, '[FAIL]');
            return {
                ip: ipAddr,
                Success: false,
                Result: `Ошибка при обработке ${ipAddr}: ${error.message}`,
            };
        }
    };

    try {
        const { ip, ponSerial, ...unexpectedParams } = req.body;

        if (Object.keys(unexpectedParams).length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Неверные имена параметров',
            });
        }

        const validationIP = validateIp(ip);
        if (!validationIP.valid) {
            return res.status(400).json({
                success: false,
                error: validationIP.error,
            });
        }

        const validationPon = validatePonSerial(ponSerial);
        if (!validationPon.valid) {
            return res.status(400).json({
                success: false,
                error: validationPon.error,
            });
        }

        // Параллельная обработка всех IP-адресов
        const results = await Promise.all(
            validationIP.ipAddresses.map(ipAddr => processIpAddress(ipAddr, ponSerial))
        );

        // Проверяем, есть ли успешный результат
        const successfulResult = results.find(result => result?.resultReceived === true);

        if (successfulResult) {
            return res.status(200).json({
                Success: true,
                Result: successfulResult,
            });
        } else {
            writeToFile(`Pon Serial ${ponSerial} не найден`);
            return res.status(404).json({
                Success: false,
                Result: `Pon Serial ${ponSerial} не найден`
            });
        }
    } catch (error) {
        writeToFile(`Ошибка при обработке ${ip}: ${error.message}`, '[FAIL]');
        return res.status(500).json({
            Success: false,
            Result: `Ошибка при обработке ${ip}: ${error.message}`
        });
    }
};

export { getStatusNtu, getResetNtu };