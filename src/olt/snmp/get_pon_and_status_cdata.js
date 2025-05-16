import snmp from 'net-snmp';
import writeToFile from '../../writeLog.js';

const getPonAndStatusCdata = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        // OID
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
                    }
                }

                // Добавляем ONT в список с серийным номером и Run state
                if (serialNumber && runState !== null) {
                    // Маппинг числовых значений Run state на читаемые строки
                    const runStateMap = {
                        1: 'Online',
                        2: 'Offline',
                        3: 'LOS',
                        0: 'Unknown'

                    };
                    const runStateStr = runStateMap[runState] || `Unknown (${runState})`;
                    ontList.push({
                        index: ontList.length + 1,
                        serial: serialNumber,
                        runState: runStateStr
                    });
                }

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    walk(varbinds[0].oid, varbinds[1].oid);
                } else {
                    session.close();
                    writeToFile(`Опрос OLT: ${ipAddress} завершён`);
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

export { getPonAndStatusCdata };