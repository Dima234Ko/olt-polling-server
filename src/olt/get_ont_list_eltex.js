const snmp = require('net-snmp');

function getOntListEltex(ipAddress) {
    return new Promise((resolve) => {
        const ntuList = [];
        const serialOid = '1.3.6.1.4.1.35265.1.22.3.1.1.2';

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        // Функция для рекурсивного перебора NTU
        function walk(currentOid) {
            session.getNext([currentOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                    return;
                }

                let continueWalk = false;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        resolve({
                            Success: false,
                            Result: `${ipAddress} - ${snmp.varbindError(vb)}`
                        });
                        return;
                    }

                    // Проверяем, что OID всё ещё в нужном поддереве
                    if (vb.oid.startsWith(serialOid)) {
                        const ntuSerial = vb.value.toString('hex');
                        ntuList.push(ntuSerial);
                        continueWalk = true;
                    }
                }

                // Выводим текущий список NTU в консоль
                console.log(`NTU list for ${ipAddress}:`, ntuList);

                // Продолжаем перебор, если еще есть данные в поддереве
                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    resolve({
                        Success: true,
                        Result: ntuList
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
}

module.exports = { getOntListEltex };