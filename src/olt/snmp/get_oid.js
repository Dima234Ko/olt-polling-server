export const get_oid_olt_cdata = () => {
    const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3'; 
    const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7'; 
    const softwareVersionOid = '1.3.6.1.4.1.17409.2.8.4.2.1.2';
    const downCase = '1.3.6.1.4.1.17409.2.8.4.1.1.103';
    const receivedPowerOid = '1.3.6.1.4.1.17409.2.8.4.4.1.4';
    const resetNtu = '1.3.6.1.4.1.17409.2.8.4.1.1.10';
    const configState = '1.3.6.1.4.1.17409.2.8.4.1.1.101';
        
        return {
            serialOid,
            runStateOid,
            softwareVersionOid,
            downCase,
            receivedPowerOid,
            resetNtu,
            configState
        };
}


export const get_oid_olt_eltex = () => {
    const serialOid = '1.3.6.1.4.1.35265.1.22.3.4.1.2'; 
    const runStateOid = '1.3.6.1.4.1.35265.1.22.3.1.1.5'; 
    const softwareVersionOid = '1.3.6.1.4.1.35265.1.22.3.1.1.17';
    const downCase = '1.3.6.1.4.1.35265.1.22.3.70.1.3';
    const receivedPowerOid = '1.3.6.1.4.1.35265.1.22.3.1.1.11';
    const resetNtu = '1.3.6.1.4.1.35265.1.22.3.1.1.22';
    const configState = '1.3.6.1.4.1.35265.1.22.3.1.1.5';
        
        return {
            serialOid,
            runStateOid,
            softwareVersionOid,
            downCase,
            receivedPowerOid,
            resetNtu,
            configState
        };
}