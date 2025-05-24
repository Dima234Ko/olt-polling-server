// Валидация IP-адреса
const isValidIp = (ip) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
};

// Проверка входных данных (IP-адрес или массив IP-адресов)
const validateIp = (ip) => {
    if (!ip) {
        return {
            valid: false,
            error: 'Не указан IP-адрес',
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

const validatePonSerial = (ponSerial) => {
    if (typeof ponSerial !== 'string') {
        return {
            valid: false,
            error: `Входной параметр должен быть строкой, получено: ${typeof ponSerial}`
        };
    }
    if (ponSerial.length < 8 || ponSerial.length > 14) {
        return {
            valid: false,
            error: `Некорректная длина PONSerial: ${ponSerial.length}, ожидается от 8 до 14 символов`
        };
    }
    if (/[A-Z]/.test(ponSerial)) {
        return {
            valid: false,
            error: `PONSerial содержит заглавные буквы: ${ponSerial}, ожидаются только строчные`
        };
    }
    if (/[А-Яа-яЁё]/.test(ponSerial)) {
        return {
            valid: false,
            error: `PONSerial содержит кириллические символы: ${ponSerial}, ожидаются только латинские символы`
        };
    }

    return { valid: true, ponSerial };
};

// Обработка неподдерживаемых моделей
const processUnsupportedModel = (ipAddr, modelResult) => ({
    ip: ipAddr,
    success: false,
    result: `Устройство ${ipAddr} не поддерживается (модель: ${modelResult})`,
});

export { processUnsupportedModel, validateIp, validatePonSerial };