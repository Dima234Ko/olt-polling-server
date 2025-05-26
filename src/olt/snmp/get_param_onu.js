import snmp from 'net-snmp';
import {filterLists} from '../work_data.js';
import writeToFile from '../../writeLog.js';

const getOnuInfoCdata = async (ipAddress, serial, oid, model) => {
    try {
        const ponList = await getPon(ipAddress, oid.serialOid, model);
        await writeToFile('Получена информация о pon serial');

        const statusList = await getStatus(ipAddress, oid.runStateOid, model);
        await writeToFile('Получена информация о status');

        const softList = await getSoftwareVersions(ipAddress, oid.softwareVersionOid, model);
        await writeToFile('Получена информация о software versions');

        const data = await filterLists(ponList, statusList, softList, serial);
        
        if (!data?.id) {
            return false;
        }

        const rxList = await getReceivedOpticalPowers(ipAddress, data.id, oid.receivedPowerOid, model);
        await writeToFile('Получена информация о optical power');

        if (rxList?.Result?.receivedOpticalPower) {
            data.receivedOpticalPower = rxList.Result.receivedOpticalPower;
        } else {
            writeToFile('Данные об оптической мощности не получены', '[FAIL]');
        }
        return data;
    } catch (error) {
        await writeToFile(`Ошибка при получении данных: ${error.message}`, '[FAIL]');
        throw error;
    }
};


const getPon = (ipAddress, serialOid, model) => {
    return new Promise((resolve) => {
        const serialList = [];

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentSerialOid) {
            session.getNext([currentSerialOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let serialNumber = null;
                let id = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        return resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(serialOid)) {
                        serialNumber = vb.value.toString('hex').substring(4);
                        if (model === 'ELTE') {
                            id = vb.oid.slice(serialOid.length + 1);
                        } else {
                            id = vb.oid.split('.').pop();
                        }
                        continueWalk = true;
                    }
                }

                if (serialNumber && id) {
                    serialList.push({
                        id,
                        serial: serialNumber
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    writeToFile(`Опрос OLT: ${ipAddress} завершён`);
                    return resolve({
                        Success: true,
                        Result: serialList
                    });
                }
            });
        }

        walk(serialOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};


const getStatus = (ipAddress, runStateOid, model) => {
    return new Promise((resolve) => {
        const runStateList = [];

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentRunStateOid) {
            session.getNext([currentRunStateOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let runState = null;
                let id = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        return resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(runStateOid)) {
                        runState = vb.value;
                        if (model === 'ELTE') {
                            id = vb.oid.slice(runStateOid.length + 1);
                        } else {
                            id = vb.oid.split('.').pop();
                        }
                        continueWalk = true;
                    }
                }

                if (runState !== null && id) {
                    runStateList.push({
                        id,
                        runState
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        Result: runStateList
                    });
                }
            });
        }

        walk(runStateOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};


const getSoftwareVersions = (ipAddress, softwareVersionOid, model) => {
    return new Promise((resolve) => {
        const softwareVersionList = [];

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentSoftwareVersionOid) {
            session.getNext([currentSoftwareVersionOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let softwareVersion = null;
                let id = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        return resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(softwareVersionOid)) {
                        softwareVersion = vb.value.toString();
                        if (model === 'ELTE') {
                            id = vb.oid.slice(softwareVersionOid.length + 1);
                        } else {
                            id = vb.oid.split('.').pop();
                        }
                        continueWalk = true;
                    }
                }

                if (softwareVersion && id) {
                    softwareVersionList.push({
                        id,
                        softwareVersion
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        Result: softwareVersionList
                    });
                }
            });
        }

        walk(softwareVersionOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};


const getReceivedOpticalPowers = (ipAddress, id, oid, model) => {
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
                Result: `${ipAddress} - Unsupported model: ${model}`
            });
        }

        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Запрашиваем одну запись по указанному OID
        session.get([receivedPowerOid], (error, varbinds) => {
            if (error) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddress} - ${error.message}`
                });
            }

            // Проверяем, получены ли данные
            if (!varbinds || varbinds.length === 0) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddress} - No data received`
                });
            }

            const vb = varbinds[0];
            if (snmp.isVarbindError(vb)) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddress} - ${snmp.varbindError(vb)}`
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
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};








const mergeOnuData = (statusList, infoList) => {
    return statusList.map((statusItem, index) => {
        const infoItem = infoList[index];
        return {
            serial: statusItem.serial,
            runState: statusItem.runState,
            softwareVersion: infoItem.softwareVersion,
            receivedOpticalPower: infoItem.receivedOpticalPower
        };
    });
};



export { getOnuInfoCdata };