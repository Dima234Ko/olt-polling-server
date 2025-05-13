import snmp from 'net-snmp';

const getLtpModel = (ipAddress) => {
    return new Promise((resolve) => {
        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version1, // mpModel=0 в pysnmp соответствует SNMPv1
            port: 161
        });

        // OID для запроса
        const oid = '1.3.6.1.2.1.1.1.0';

        // Выполняем SNMP GET запрос
        session.get([oid], (error, varbinds) => {
            // Закрываем сессию
            session.close();

            if (error) {
                return resolve({
                    Success: false,
                    Result: `${ipAddress} - ${error.message}`
                });
            }

            // Проверяем varbinds
            if (varbinds.length === 0 || snmp.isVarbindError(varbinds[0])) {
                const errorMsg = varbinds.length > 0 ? snmp.varbindError(varbinds[0]) : 'No response';
                return resolve({
                    Success: false,
                    Result: `${ipAddress} - ${errorMsg}`
                });
            }

            // Успешный результат
            return resolve({
                Success: true,
                Result: varbinds[0].value.toString().substring(0, 4) 
            });
        });

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

export { getLtpModel };