import snmp from 'net-snmp';

const getOnuInfoCdata = async (ipAddress, serial) => {
    return new Promise((resolve) => {
        const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3';             // Серийный номер
        const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7';           // Статус
        const softwareVersionOid = '1.3.6.1.4.1.17409.2.8.4.2.1.2';     // Прошивка
        const receivedPowerOid = '1.3.6.1.4.1.17409.2.8.4.4.1.4';       // Входящий сигнал

        const runStateMap = {
            1: 'Online',
            2: 'Offline',
            3: 'LOS',
            0: 'Unknown'
        };

        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161,
        });

        function walk(
            currentSerialOid,
            currentRunStateOid,
            currentSoftwareVersionOid,
            currentReceivedPowerOid
        ) {
            session.getNext(
                [
                    currentSerialOid,
                    currentRunStateOid,
                    currentSoftwareVersionOid,
                    currentReceivedPowerOid
                ],
                (error, varbinds) => {
                    if (error) {
                        session.close();
                        return resolve({
                            success: false,
                            result: `${ipAddress} - ${error.message}`
                        });
                    }

                    let foundSerial = null;
                    let runState = null;
                    let softwareVersion = null;
                    let receivedPower = null;
                    let continueWalk = false;

                    for (const vb of varbinds) {
                        if (snmp.isVarbindError(vb)) {
                            session.close();
                            return resolve({
                                success: false,
                                result: `${ipAddress} - ${snmp.varbindError(vb)}`
                            });
                        }

                        if (vb.oid.startsWith(serialOid)) {
                            foundSerial = vb.value.toString('hex').substring(4);  // Преобразуем серийный номер в строку
                            continueWalk = true;
                        }

                        if (vb.oid.startsWith(runStateOid)) {
                            runState = runStateMap[vb.value] || 'Unknown';
                        }

                        if (vb.oid.startsWith(softwareVersionOid)) {
                            softwareVersion = vb.value.toString('hex');  // Преобразуем версию прошивки в строку
                        }

                        if (vb.oid.startsWith(receivedPowerOid)) {
                            receivedPower = vb.value;
                        }
                    }

                    if (
                        foundSerial === serial &&
                        runState !== null &&
                        softwareVersion !== null &&
                        receivedPower !== null
                    ) {
                        session.close();
                        return resolve({
                            success: true,
                            data: {
                                ip: ipAddress,
                                serial,
                                runState,
                                softwareVersion,
                                receivedOpticalPower: receivedPower
                            }
                        });
                    }

                    if (continueWalk) {
                        // Рекурсивный вызов функции, чтобы пройти по всем OID
                        walk(
                            varbinds[0].oid,
                            varbinds[1].oid,
                            varbinds[2].oid,
                            varbinds[3].oid
                        );
                    } else {
                        session.close();
                        return resolve({
                            success: false,
                            result: `Не удалось найти NTU с серийным номером ${serial}`
                        });
                    }
                }
            );
        }

        walk(
            serialOid,
            runStateOid,
            softwareVersionOid,
            receivedPowerOid
        );

        session.on('timeout', () => {
            session.close();
            resolve({
                success: false,
                result: `${ipAddress} - Timeout`
            });
        });
    });
};

export { getOnuInfoCdata };
