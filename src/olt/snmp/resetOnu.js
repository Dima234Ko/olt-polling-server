import snmp from 'net-snmp';
import writeToFile from '../../writeLog.js'

const resetONU = (ipAddr, id, oid) => {
    return new Promise((resolve, reject) => {
        const currentOid = `${oid}.${id}`; // Формируем полный OID
        const session = snmp.createSession(ipAddr, 'private');
        const varbinds = [
            {
                oid: currentOid,
                type: snmp.ObjectType.Integer,
                value: 1
            }
        ];

        session.set(varbinds, (error, varbinds) => {
            session.close();
            if (error) {
                writeToFile ('Ошибка при отправке SNMP-запроса:', error.message, '[FAIL]');
                reject(error);
            } else {
                let result = {
                    ip: ipAddr,
                    resultReceived: true,
                    Result: varbinds[0].value
                }
                resolve(result);
            }
        });
    });
};

export { resetONU };