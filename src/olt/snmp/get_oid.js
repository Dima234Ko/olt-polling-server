export const get_oid_olt_cdata = () => {
    const serialOid = '1.3.6.1.4.1.17409.2.8.4.1.1.3'; 
    const runStateOid = '1.3.6.1.4.1.17409.2.8.4.1.1.7'; 
    const softwareVersionOid = '1.3.6.1.4.1.17409.2.8.4.2.1.2';
    const receivedPowerOid = '1.3.6.1.4.1.17409.2.8.4.4.1.4';
        
        return {
            serialOid,
            runStateOid,
            softwareVersionOid,
            receivedPowerOid
        };
}


export const get_oid_olt_eltex = () => {
    const serialOid = '1.3.6.1.4.1.35265.1.22.3.4.1.2'; 
    const runStateOid = '1.3.6.1.4.1.35265.1.22.3.1.1.5'; 
    const softwareVersionOid = '1.3.6.1.4.1.35265.1.22.3.1.1.17';
    const receivedPowerOid = '1.3.6.1.4.1.35265.1.22.3.1.1.11';
        
        return {
            serialOid,
            runStateOid,
            softwareVersionOid,
            receivedPowerOid
        };
}