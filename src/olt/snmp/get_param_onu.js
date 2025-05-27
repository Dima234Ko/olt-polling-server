import snmp from 'net-snmp';
import {filterLists} from '../work_data.js';
import writeToFile from '../../writeLog.js';

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

const getParam = (ipAddr, oid, model, param) => {
    return new Promise((resolve) => {
        const valueList = [];

        const session = snmp.createSession(ipAddr, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentOid) {
            session.getNext([currentOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddr} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let value = null;
                let id = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        return resolve({
                            Success: false,
                            Result: `${ipAddr} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(oid)) {
                        
                        if (param === 'serial'){
                            value = vb.value.toString('hex').substring(4);
                        } else if (param === 'softwareVersion'){
                            value = vb.value.toString();
                        } else {
                            value = vb.value;
                        }

                        if (model === 'ELTE') {
                            id = vb.oid.slice(oid.length + 1);
                        } else {
                            id = vb.oid.split('.').pop();
                        }
                        continueWalk = true;
                    }
                }

                if (value !== null && id) {
                    valueList.push({
                        id,
                        [param]: value
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        Result: valueList
                    });
                }
            });
        }

        walk(oid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddr} - Timeout`
            });
        });
    });
};


const getReceivedOpticalPowers = (ipAddr, id, oid, model) => {
    return new Promise((resolve) => {
        let receivedPowerOid;
        if (model === 'FD16') {
            receivedPowerOid = `${oid}.${id}.0.0`;
        } else if (model === 'ELTE') {
            receivedPowerOid = `${oid}.${id}`;
        } else {
            writeToFile(`Модель OLT ${ipAddr} не известна: ${model}`, '[FAIL]');
            return resolve({
                Success: false,
                Result: `${ipAddr} - Unsupported model: ${model}`
            });
        }

        const session = snmp.createSession(ipAddr, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        session.get([receivedPowerOid], (error, varbinds) => {
            if (error) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - ${error.message}`
                });
            }

            if (!varbinds || varbinds.length === 0) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - No data received`
                });
            }

            const vb = varbinds[0];
            if (snmp.isVarbindError(vb)) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - ${snmp.varbindError(vb)}`
                });
            }

            session.close();
            resolve({
                Success: true,
                Result: {
                    id,
                    receivedOpticalPower: vb.value
                }
            });
        });

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddr} - Timeout`
            });
        });
    });
};

export { getOnuInfo };