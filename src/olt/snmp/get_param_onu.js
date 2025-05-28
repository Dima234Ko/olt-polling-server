import snmp from 'net-snmp';

const getParam = (ipAddr, oid, model, param) => {
    return new Promise((resolve) => {
        const valueList = [];

        const session = snmp.createSession(ipAddr, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        function walk(currentOid) {
            session.getNext([currentOid], (error, varbinds) => {
                if (error) {
                    session.close();
                    return resolve({
                        Success: false,
                        Result: `${ipAddr} - ${error.message}`
                    });
                }

                let continueWalk = false;
                let value = null;
                let id = null;

                for (const vb of varbinds) {
                    if (snmp.isVarbindError(vb)) {
                        session.close();
                        return resolve({
                            Success: false,
                            Result: `${ipAddr} - ${snmp.varbindError(vb)}`
                        });
                    }

                    if (vb.oid.startsWith(oid)) {
                        
                        if (param === 'serial'){
                            value = vb.value.toString('hex').substring(4);
                        } else if (param === 'softwareVersion'){
                            value = vb.value.toString();
                        } else {
                            value = vb.value;
                        }

                        if (model === 'ELTE') {
                            id = vb.oid.slice(oid.length + 1);
                        } else {
                            id = vb.oid.split('.').pop();
                        }
                        continueWalk = true;
                    }
                }

                if (value !== null && id) {
                    valueList.push({
                        id,
                        [param]: value
                    });
                }

                if (continueWalk) {
                    walk(varbinds[0].oid);
                } else {
                    session.close();
                    return resolve({
                        Success: true,
                        Result: valueList
                    });
                }
            });
        }

        walk(oid);

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddr} - Timeout`
            });
        });
    });
};

export { getParam };


