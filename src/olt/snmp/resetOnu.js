import snmp from 'net-snmp';
import writeToFile from '../../writeLog.js'

const resetONU = (ipAddr, id, oid, model) => {
    return new Promise((resolve, reject) => {
        const currentOid = `${oid}.${id}`;
        const session = snmp.createSession(ipAddr, 'private');
        let varbinds = null;
        
        if (model.Result === 'FD16'){
            varbinds = [
                {
                    oid: currentOid,
                    type: snmp.ObjectType.Integer,
                    value: 1
                }
            ];

        } else if (model.Result === 'ELTE') {
            varbinds = [
                {
                    oid: currentOid,
                    type: snmp.ObjectType.Gauge,
                    value: 1
                }
            ];
        }

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