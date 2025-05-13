import snmp from 'net-snmp';

const getPonForCdata = (ipAddress) => {
    return new Promise((resolve) => {
        const ontList = [];
        // OID для серийного номера
        const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3';

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Функция для рекурсивного перебора ONT
        function walk(currentSerialOid) {
            session.getNext([currentSerialOid], (error, varbinds) => {
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
                }

                // Добавляем ONT в список с серийным номером
                if (serialNumber) {
                    ontList.push({
                        index: ontList.length + 1,
                        serial: serialNumber
                    });
                }

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    walk(varbinds[0].oid);
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

        // Начинаем обход с базового OID
        walk(serialOid);

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

export { getPonForCdata };