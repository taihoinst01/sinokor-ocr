var createTree = require('dirtree');
var oracledb = require('oracledb');
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
        var insertArr = [];
        console.log(tree);
        for (fullpath in tree.leaves()) {
            let idx = tree.leaves()[fullpath].lastIndexOf('/');
            let dotIdx = tree.leaves()[fullpath].lastIndexOf('.');
            if (idx >= 0) {
                tempArr = [];
                tempArr.push(tree.leaves()[fullpath].substring(idx + 1, dotIdx));
                tempArr.push(tree.leaves()[fullpath].substring(0, idx + 1));
                tempArr.push(tree.leaves()[fullpath].substring(idx + 1));
                insertArr.push(tempArr);
            } else {
                tempArr = [];
                tempArr.push(tree.leaves()[fullpath].substring(0, dotIdx));
                tempArr.push('');
                tempArr.push(tree.leaves()[fullpath]);
                insertArr.push(tempArr);

            }
        }
        for (var item in insertArr) {
            connection.execute(
                "insert into tbl_batch_learn_data(IMGID,FILEPATH,FILENAME,REGDATE,STATUS) VALUES(:IMGID,:FILEPATH,:FILENAME,SYSDATE,'N')"
                , [insertArr[item][0], insertArr[item][1], insertArr[item][2]]
                ,
                function (err) {
                    if (err) {
                        console.log(err.message);
                        return;
                    }
                    connection.commit(function (err) {
                        if (err) {
                            console.log(err.message);
                            return;
                        }
                    })
                });
        }

    });






