const mergeArraysById = (array1, array2, array3) => {
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
    addToMap(array1);
    addToMap(array2);
    addToMap(array3);

    // Преобразуем Map в массив
    return Array.from(mergedMap.values());
};

const filterLists =  async (ponList, statusList, softList, serial) => {
    const mergedData = mergeArraysById(ponList.Result, statusList.Result, softList.Result);
    const mergedDataOnline = mergedData.filter(ont => ont.runState !== 2);
    const data = mergedDataOnline.find(item => item.serial === serial);
    return data;
}

export { filterLists };