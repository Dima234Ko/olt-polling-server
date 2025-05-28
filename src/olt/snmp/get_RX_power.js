import snmp from 'net-snmp';

const getReceivedOpticalPowers = (ipAddr, id, oid, model) => {
    return new Promise((resolve) => {
        let receivedPowerOid;
        if (model === 'FD16') {
            receivedPowerOid = `${oid}.${id}.0.0`;
        } else if (model === 'ELTE') {
            receivedPowerOid = `${oid}.${id}`;
        } else {
            writeToFile(`Модель OLT ${ipAddr} не известна: ${model}`, '[FAIL]');
            return resolve({
                Success: false,
                Result: `${ipAddr} - Unsupported model: ${model}`
            });
        }

        const session = snmp.createSession(ipAddr, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        session.get([receivedPowerOid], (error, varbinds) => {
            if (error) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - ${error.message}`
                });
            }

            if (!varbinds || varbinds.length === 0) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - No data received`
                });
            }

            const vb = varbinds[0];
            if (snmp.isVarbindError(vb)) {
                session.close();
                return resolve({
                    Success: false,
                    Result: `${ipAddr} - ${snmp.varbindError(vb)}`
                });
            }

            session.close();
            resolve({
                Success: true,
                Result: {
                    id,
                    receivedOpticalPower: vb.value
                }
            });
        });

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddr} - Timeout`
            });
        });
    });
};

export { getReceivedOpticalPowers };