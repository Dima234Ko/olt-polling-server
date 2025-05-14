import snmp from 'net-snmp';
import {filterLists} from '../work_data.js';

const getOnuInfoEltex = async (ipAddress, serial) => {
    const ponList = await getPon(ipAddress);
    const statusList = await getStatus(ipAddress);
    const softList = await getSoftwareVersions(ipAddress);
    const rxList = await getReceivedOpticalPowers(ipAddress);
    const data = await filterLists(ponList, statusList, softList, rxList, serial);
    return (data);
};

const getPon = (ipAddress) => {
    return new Promise((resolve) => {
        const serialList = [];

        const serialOid = '1.3.6.1.4.1.35265.1.22.3.1.1.2'; 

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
                    console.log(`Опрос OLT: ${ipAddress} завершён`);
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
    const runStateOid = '1.3.6.1.4.1.35265.1.22.3.4.1.20'; 

    return new Promise((resolve) => {
        const dataList = [];
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

                if (runState !== null && id !== null) {
                    dataList.push({
                        id,
                        runState
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    resolve({
                        Success: true,
                        Result: dataList
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
    const softwareVersionOid = '1.3.6.1.4.1.35265.1.22.3.1.1.17';

    return new Promise((resolve) => {
        const dataList = [];
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentOid) {
            session.getNext([currentOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
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
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(softwareVersionOid)) {
                        value = vb.value.toString() || 'Unknown';
                        id = vb.oid.split('.').pop();
                        continueWalk = true;
                    }
                }

                if (value !== null && id !== null) {
                    dataList.push({
                        id,
                        softwareVersion: value
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    resolve({
                        Success: true,
                        Result: dataList
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


const getReceivedOpticalPowers = (ipAddress) => {
    const receivedOpticalPowerOid = '1.3.6.1.4.1.35265.1.22.3.1.1.11';

    return new Promise((resolve) => {
        const dataList = [];
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentOid) {
            session.getNext([currentOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
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
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(receivedOpticalPowerOid)) {
                        value = vb.value !== null ? vb.value : 'Unknown';
                        id = vb.oid.split('.').pop();
                        continueWalk = true;
                    }
                }

                if (value !== null && id !== null) {
                    dataList.push({
                        id,
                        receivedOpticalPower: value
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    resolve({
                        Success: true,
                        Result: dataList
                    });
                }
            });
        }

        walk(receivedOpticalPowerOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};

export { getOnuInfoEltex };