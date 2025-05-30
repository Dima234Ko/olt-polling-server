import snmp from 'net-snmp';
import writeToFile from '../../writeLog.js';

const getPonForEltex = (ipAddress) => {
    return new Promise((resolve) => {
        const serialList = [];
        const serialOid = '1.3.6.1.4.1.35265.1.22.3.1.1.2'

        // Создаем SNMP-сессию
        const session = snmp.createSession(ipAddress, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentSerialOid) {
            session.getNext([currentSerialOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddress} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let serialNumber = null;
                let idNtu = null;

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
                        idNtu = vb.oid.slice(serialOid.length + 1);
                        continueWalk = true;
                    }
                }

                if (serialNumber) {
                    serialList.push({
                        index: serialList.length + 1,
                        id: idNtu,
                        serial: serialNumber
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    writeToFile(`Опрос OLT: ${ipAddress} завершён`);
                    return resolve({
                        Success: true,
                        Result: serialList
                    });
                }
            });
        }

        walk(serialOid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddress} - Timeout`
            });
        });
    });
};

export { getPonForEltex };