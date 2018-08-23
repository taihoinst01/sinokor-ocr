var createTree = require('dirtree');
var oracledb = require('oracledb');
var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.extend(oracledb);
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
oracledb.autoCommit = true;
var tree = createTree();
tree.root('C://tmp//1')
    .exclude('dirs', /^\./)
    .exclude('files', /^\./)
    .create();

oracledb.getConnection(dbConfig,
    function (err, connection) {

        if (err) {
            console.error(err.message);
            return;
        }
        var insertArr = []
        for (fullpath in tree.leaves()) {
            let idx = tree.leaves()[fullpath].lastIndexOf('/');
            if (idx >= 0) {
                tempArr = []
                tempArr.push(tree.leaves()[fullpath].substring(0, idx + 1))
                tempArr.push(tree.leaves()[fullpath].substring(idx + 1))
                insertArr.push(tempArr)
            } else {
                tempArr = []
                tempArr.push('')
                tempArr.push(tree.leaves()[fullpath])
                insertArr.push(tempArr)

            }
        }
        var temp = [];
        for (var item in insertArr) {
            temp.push({ id: insertArr[item][0], data: insertArr[item][1] })
            if (temp.length > 1) {
                connection.batchInsert(
                    "insert into TBL_TEST_STR(ID, DATAS) VALUES(:id, :data)"
                    , temp
                    , {autoCommit: true}
                    , function onResults(error, output) {
                        //continue flow...
                    }
                );
                temp = [];
            }
        }
        connection.batchInsert(
            "insert into TBL_TEST_STR(ID, DATAS) VALUES(:id, :data)"
            , temp
            , {autoCommit: true}
            , function onResults(error, output) {
                //continue flow...
            }
        );
    });






