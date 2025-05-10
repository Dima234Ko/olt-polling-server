const snmp = require('net-snmp');

function getOntListCdata(ipAddress) {
    return new Promise((resolve) => {
        const ontList = [];
        // Временные OID (замените на реальные для C-Data FD1608S-B1 после выполнения snmpwalk или получения MIB)
        const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3';
        const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7';

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
                        // Отладочный вывод для проверки значений Run state
                        console.log(`ONT ${serialNumber}: Run state = ${runState}`);
                    }
                }

                // Добавляем ONT в список с серийным номером и Run state
                if (serialNumber && runState !== null) {
                    // Маппинг числовых значений Run state на читаемые строки (обновите после проверки)
                    const runStateMap = {
                        1: 'Online',
                        2: 'Offline',
                        3: 'LOS',
                        0: 'Unknown'
                        // Добавьте другие значения на основе MIB C-Data
                    };
                    const runStateStr = runStateMap[runState] || `Unknown (${runState})`;
                    ontList.push({
                        serial: serialNumber,
                        runState: runStateStr
                    });
                }

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    walk(varbinds[0].oid, varbinds[1].oid);
                } else {
                    session.close();
                    resolve({
                        Success: true,
                        Result: ontList
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
}

module.exports = {
    getOntListCdata
};