import snmp from 'net-snmp';
import {filterLists} from '../work_data.js';
import writeToFile from '../../writeLog.js';

const getOnuInfoCdata = async (ipAddress, serial) => {
    const ponList = await getPon(ipAddress);
    writeToFile('Получена информация о pon serial');
    const statusList = await getStatus(ipAddress);
    writeToFile('Получена информация о status');
    const softList = await getSoftwareVersions(ipAddress);
    writeToFile('Получена информация о software versions');
    const data = await filterLists(ponList, statusList, softList, serial);
    const rxList = await getReceivedOpticalPowers(ipAddress, data.id);
    writeToFile('Получена информация о optical power');
    data.receivedOpticalPower = rxList.Result.receivedOpticalPower;
    return (data);
};


const getPon = (ipAddress) => {
    return new Promise((resolve) => {
        const serialList = [];
        const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3'; // Серийный номер

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
                        id = vb.oid.split('.').pop();
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


const getStatus = (ipAddress) => {
    return new Promise((resolve) => {
        const runStateList = [];
        const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7'; // Статус

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
                        id = vb.oid.split('.').pop();
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


const getSoftwareVersions = (ipAddress) => {
    return new Promise((resolve) => {
        const softwareVersionList = [];
        const softwareVersionOid = '1.3.6.1.4.1.17409.2.8.4.2.1.2'

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
                        id = vb.oid.split('.').pop();
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


const getReceivedOpticalPowers = (ipAddress, id) => {
    return new Promise((resolve) => {
        // Формируем полный OID с использованием id
        const receivedPowerOid = `1.3.6.1.4.1.17409.2.8.4.4.1.4.${id}.0.0`;

        // Создаем SNMP-сессию
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

            for (const vb of varbinds) {
                if (snmp.isVarbindError(vb)) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                    });
                }

                // Возвращаем результат для единственного OID
                session.close();
                return resolve({
                    Success: true,
                    Result: {
                        id,
                        receivedOpticalPower: vb.value
                    }
                });
            }
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