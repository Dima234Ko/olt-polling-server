const mergeArraysById = (param) => {
    const {ponList, statusList, softList, downCase, model} = param;
    const mergedMap = new Map();

    // Функция для добавления данных из массива в Map
    const addToMap = (array) => {
        if (Array.isArray(array)) {
            array.forEach(item => {
                if (item && item.id) {
                    if (!mergedMap.has(item.id)) {
                        mergedMap.set(item.id, { id: item.id });
                    }
                    Object.assign(mergedMap.get(item.id), item);
                }
            });
        }
    };

    // Обрабатываем все массивы
    addToMap(ponList.Result);
    addToMap(statusList.Result);
    addToMap(softList.Result);
    addToMap(downCase.Result);

    // Преобразуем Map в массив
    return Array.from(mergedMap.values());
};

const filterLists = async (param) => {  
    
    const {ponList, statusList, softList, ponSerial, downCase, model} = param;

    const mergedData = mergeArraysById({ponList, statusList, softList, downCase, model});
    
    if (model.Result === 'ELTE') {
        mergedData.forEach(item => {
            item.runState = item.runState == 7 ? '1' : '2';
        });
    }

    if (!ponSerial) {
        return mergedData;
    }

    const mergedDataOnline = mergedData.filter(ont => ont.runState !== '2');
    const data = mergedDataOnline.find(item => item.serial === ponSerial);
    return data;
}

const processingСonfigState = async (param, model) => {  
    if (model === 'FD16') {
        const stateMap = {
            0: 'Не определен',
            1: 'ONT готова к работе',
            2: 'Происходит конфигурирование или обновление прошивки ONT'
        };
        return stateMap[param] || 'Неизвестное состояние';
    }

    if (model === 'ELTE') {
        const stateMap = {
            0: 'ONT не зарегистрирована',
            1: 'ONT в процессе авторизации',
            2: 'ONT в процессе авторизации',
            3: 'Ошибка авторизации',
            4: 'ONT в процессе активации',
            5: 'Идёт передача конфигурации на ONT',
            6: 'Ошибка конфигурации ONT',
            7: 'ONT готова к работе',
            8: 'Ошибка ONT',
            9: 'ONT заблокирована',
            10: 'Требуется сброс ONT',
            11: 'ONT предварительно сконфигурирована',
            12: 'Обновление прошивки ONT',
            13: 'ONT деактивирована ',
            14: 'Резервная ONT'
        };
        return stateMap[param] || 'Неизвестное состояние';
    }
    return 'Неизвестное состояние';
}


export { filterLists, processingСonfigState };