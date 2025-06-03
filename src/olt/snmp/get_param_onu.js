import snmp from 'net-snmp';

const generateOid = (oid, id, model, param) => {
    if (param === 'receivedOpticalPower' && model === 'FD16'){
        return `${oid}.${id}.0.0`;
    } else {
        return `${oid}.${id}`;
    }
};

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
                        } else if (param === 'softwareVersion' || 'downCase'){
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

const getOneParam = (ipAddr, id, oid, model, param) => {
    return new Promise((resolve) => {
        const currentOid = generateOid(oid, id, model, param);

        const session = snmp.createSession(ipAddr, 'public', {
            version: snmp.Version2c,
            port: 161
        });

        session.get([currentOid], (error, varbinds) => {
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
                    Result: `${ipAddr} - Нет полученных данных`
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
                    [param]: vb.value
                }
            });
        });

        session.on('timeout', () => {
            session.close();
            resolve({
                Success: false,
                Result: `${ipAddr} - Тайм-аут`
            });
        });
    });
};

export { getParam, getOneParam };


