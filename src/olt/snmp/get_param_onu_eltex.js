import snmp from 'net-snmp';

const getOnuInfoEltex = async (ipAddress, serial) => {
    const statusList = await getStatusNtuforEltex(ipAddress);
    const data = statusList.Result.ontList.find(item => item.serial === serial);
    return data;
};

const getStatusNtuforEltex = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        const serialOid = '1.3.6.1.4.1.35265.1.22.2.3.1.4';  // OID для серийного номера
        const runStateOid = '1.3.6.1.4.1.35265.1.22.3.4.1.20';  // OID для состояния устройства
        const softwareVersionOid = '1.3.6.1.4.1.35265.1.22.3.1.1.17'; // OID для версии прошивки
        const receivedOpticalPowerOid = '1.3.6.1.4.1.35265.1.22.3.1.1.11';   // OID для Rx-уровня сигнала

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentSerialOid, currentRunStateOid, currentSoftwareVersionOid, currentReceivedOpticalPowerOid) {
            session.getNext([currentSerialOid, currentRunStateOid, currentSoftwareVersionOid, currentReceivedOpticalPowerOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let serialNumber = null;
                let runState = null;
                let softwareVersion = null;
                let receivedOpticalPower = null;

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
                        continueWalk = true;
                    }

                    if (vb.oid.startsWith(runStateOid)) {
                        runState = vb.value;
                    }

                    if (vb.oid.startsWith(softwareVersionOid)) {
                        softwareVersion = vb.value.toString();
                    }

                    if (vb.oid.startsWith(receivedOpticalPowerOid)) {
                        receivedOpticalPower = vb.value;
                    }
                }

                if (serialNumber && runState !== null) {
                    ontList.push({
                        index: ontList.length + 1,
                        serial: serialNumber,
                        runState: runState,
                        softwareVersion: softwareVersion || 'Unknown',
                        receivedOpticalPower: receivedOpticalPower !== null ? receivedOpticalPower : 'Unknown'
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid, varbinds[1].oid, varbinds[2].oid, varbinds[3].oid);
                } else {
                    session.close();
                    console.log(`Опрос OLT: ${ipAddress} завершён`);
                    return resolve({
                        Success: true,
                        Result: {
                            totalCount: ontList.length,
                            ontList: ontList
                        }
                    });
                }
            });
        }

        walk(serialOid, runStateOid, softwareVersionOid, receivedOpticalPowerOid);

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