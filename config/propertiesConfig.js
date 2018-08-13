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
        subscriptionKey: '172cbd45da044432a1c1871d12d71205',
    },
    filepath: {
        //develop
        logfilepath: 'c:/logs',
        //realExcelPath: 'C:\\Users\\Taiho\\Desktop\\labeled_data',
        //product
        //logfilepath: 'c:/logs'
        excelBatchFilePath: '/ICR/labeled_data/filepath_mapping_20180720.xlsx',
        excelBatchFileData: '/ICR/labeled_data/labeled_data_20180723.xlsx',
        realExcelPath: '/image/labeled_data',
        imagePath: '/ICR/image'
    }
};

module.exports = propertiesConfig;

