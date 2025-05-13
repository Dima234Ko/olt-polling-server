import snmp from 'net-snmp';

const getOnuInfoCdata = async (ipAddress, serial) => {
    const statusList = await getStatusNtufoCdata (ipAddress);
    const onlineList  = statusList.ontList.filter(ont => ont.runState === 1);
    const infoList = await getInfoOnuCdata(ipAddress);
    const mergedData = mergeOnuData(onlineList, infoList.ontList);
    const data = mergedData.find(item => item.serial === serial);
    return (data);
};

const getStatusNtufoCdata = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        // OID для нужных данных
        const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3';  // Серийный номер
        const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7'; // Статус

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Функция для рекурсивного перебора ONT
        function walk(currentSerialOid, currentRunStateOid) {
            session.getNext([currentSerialOid, currentRunStateOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                    return;
                }

                let continueWalk = false;
                let serialNumber = null;
                let runState = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                        return;
                    }

                    // Обработка серийного номера
                    if (vb.oid.startsWith(serialOid)) {
                        serialNumber = vb.value.toString('hex').substring(4);
                        continueWalk = true;
                    }

                    // Обработка Run state
                    if (vb.oid.startsWith(runStateOid)) {
                        runState = vb.value;
                    }
                }

                // Добавляем ONT в список с серийным номером и Run state
                if (serialNumber && runState !== null) {
                    ontList.push({
                        serial: serialNumber,
                        runState: runState
                    });
                }

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    walk(varbinds[0].oid, varbinds[1].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        ontList: ontList
                    });
                }
            });
        }

        // Начинаем обход с базовых OID
        walk(serialOid, runStateOid);

        // Обработка таймаута
        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};

const getInfoOnuCdata = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        // OID для нужных данных
        const softwareVersionOid = '1.3.6.1.4.1.17409.2.8.4.2.1.2';  // Прошивка
        const receivedPowerOid = '1.3.6.1.4.1.17409.2.8.4.4.1.4';    // Входящий сигнал

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Функция для рекурсивного перебора ONT
        function walk(currentSoftwareVersionOid, currentReceivedPowerOid) {
            session.getNext([currentSoftwareVersionOid, currentReceivedPowerOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                    return;
                }

                let continueWalk = false;
                let softwareVersion = null;
                let receivedPower = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                        return;
                    }

                    // Обработка версии прошивки
                    if (vb.oid.startsWith(softwareVersionOid)) {
                        softwareVersion = vb.value.toString();
                        continueWalk = true;  // Если данные есть, продолжаем обход
                    }

                    // Обработка входящего сигнала
                    if (vb.oid.startsWith(receivedPowerOid)) {
                        receivedPower = vb.value;
                    }
                }

                // Добавляем ONT в список с прошивкой и уровнем сигнала
                if (softwareVersion !== null || receivedPower !== null) {
                    ontList.push({
                        softwareVersion: softwareVersion || 'Unknown',
                        receivedOpticalPower: receivedPower !== null ? receivedPower : 'Unknown'
                    });
                }

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    // Применяем новый OID для следующей итерации, чтобы продолжить поиск данных
                    walk(varbinds[0].oid, varbinds[1].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        ontList: ontList
                    });
                }
            });
        }

        // Начинаем обход с базовых OID
        walk(softwareVersionOid, receivedPowerOid);

        // Обработка таймаута
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