import snmp from 'net-snmp';

const getPonAndStatusEltex = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        const serialOid = '1.3.6.1.4.1.35265.1.22.2.3.1.4';  // OID для серийного номера
        const runStateOid = '1.3.6.1.4.1.35265.1.22.3.4.1.20';  // OID для состояния устройства

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Маппинг значений RunState
        const runStateMap = {
            1: 'Online',
            2: 'Offline',
            3: 'LOS',
            0: 'Unknown'
            // Добавьте другие значения на основе MIB C-Data
        };

        function walk(currentSerialOid, currentRunStateOid) {
            session.getNext([currentSerialOid, currentRunStateOid], (error, varbinds) => {
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
                }

                if (serialNumber && runState !== null) {
                    const runStateStr = runStateMap[runState] || `Unknown (${runState})`;
                    ontList.push({
                        index: ontList.length + 1,
                        serial: serialNumber,
                        runState: runStateStr
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid, varbinds[1].oid);
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

        walk(serialOid, runStateOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};

export { getPonAndStatusEltex };