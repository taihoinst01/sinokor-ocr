var propertiesConfig = {
    common: {

    },
    proxy: {
        serverUrl: 'https://sinokor-rest.azurewebsites.net'
    },
    uiLearning: {

    },
    batchLearning: {

    },
    ocr: {
        uri: 'https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr',
        subscriptionKey: 'fedbc6bb74714bd78270dc8f70593122',
    },
    filepath: {
        //develop
        logfilepath: 'c:/logs',
        //realExcelPath: 'C:\\Users\\Taiho\\Desktop\\labeled_data',
        //product
        //logfilepath: 'c:/logs'
        excelBatchFilePath: '/excel/filepath.xlsx',
        excelBatchFileData: '/excel/data.xlsx',
        realExcelPath: '/image/labeled_data'
    }
};

module.exports = propertiesConfig;

