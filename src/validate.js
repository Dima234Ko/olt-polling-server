// Валидация IP-адреса
const isValidIp = (ip) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
};

// Проверка входных данных (IP-адрес или массив IP-адресов)
const validateInput = (ip) => {
    if (!ip) {
        return {
            valid: false,
            error: 'IP-адрес или массив IP-адресов не указан в теле запроса',
        };
    }

    const ipAddresses = Array.isArray(ip) ? ip : [ip];
    for (const ipAddr of ipAddresses) {
        if (!isValidIp(ipAddr)) {
            return {
                valid: false,
                error: `Некорректный формат IP-адреса: ${ipAddr}`,
            };
        }
    }

    return { valid: true, ipAddresses };
};

// Обработка неподдерживаемых моделей
const processUnsupportedModel = (ipAddr, modelResult) => ({
    ip: ipAddr,
    success: false,
    result: `Устройство ${ipAddr} не поддерживается (модель: ${modelResult})`,
});

export { processUnsupportedModel, validateInput };