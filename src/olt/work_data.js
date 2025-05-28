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


export { filterLists };