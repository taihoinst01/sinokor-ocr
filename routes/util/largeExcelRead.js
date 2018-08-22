var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');
var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
oracledb.autoCommit = true;

var instream = fs.createReadStream('./excel/1.txt');
var outstream = new stream;
outstream.readable = true;
outstream.writable = true;

var rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false
});

oracledb.getConnection(dbConfig,
    function (err, connection) {

        if (err) {
            console.error(err.message);
            return;
        }
        rl.on('line', function (line) {
            var arr = line.split('\t')

            console.log(arr[0]);
            for (var i = 1, x = dataResult.length; i < x; i++) { // 첫번째 행은 무시
                if (!commonUtil.isNull(dataResult[i][0])) {
                    let data = [];
                    for (var j = 0, y = dataResult[i].length; j < y; j++) {
                        data.push(commonUtil.nvl(dataResult[i][j]));
                    }
                    console.log(`insert dataResult : ` + x);
                    commonDB.queryNoRows(queryConfig.batchLearningConfig.insertBatchAnswerData, data, callbackBlank);
                } else {
                    console.log(`finish insert dataResult...`);
                    continue;
                }
            }
            //Do your stuff ...
            //Then write to outstream
            if (!isNaN(arr[0])) {
                rl.write(

                    connection.execute(
                        `INSERT INTO tbl_batch_answer_data (
                        imgId, imgFileStartNo, imgFileEndNo, entryNo, statementDiv, contractNum, ogCompanyCode, ogCompanyName, brokerCode, brokerName,
                        ctnm, insstdt, insenddt, uy, curcd, paidpercent, paidshare, oslpercent, oslshare, grosspm, pm, pmpfend, pmpfwos, xolpm,
                        returnpm, grosscn, cn, profitcn, brokerage, tax, overridingcom, charge, pmreservertd1, pfpmreservertd1, pmreservertd2, pfpmreservertd2,
                        claim, lossrecovery, cashloss, cashlossrd, lossrr, lossrr2, losspfend, losspfwoa, interest, taxon, miscellaneous, pmbl,
                        cmbl, ntbl, cscosarfrncnnt2
                    ) VALUES (
                        :imgId, :imgfilestartno, :imgfileendno, :entryno, :statementdiv, :contractnum, :ogcompanycode, :ogcompanyname, :brokercode, :brokername,
                        :ctnm, :insstdt, :insenddt, :uy, :curcd, :paidpercent, :paidshare, :oslpercent, :oslshare, :grosspm, :pm, :pmpfend, :pmpfwos, :xolpm,
                        :returnpm, :grosscn, :cn, :profitcn, :brokerage, :tax, :overridingcom, :charge, :pmreservertd1, :pfpmreservertd1, :pmreservertd2, :pfpmreservertd2,
                        :claim, :lossrecovery, :cashloss, :cashlossrd, :lossrr, :lossrr2, :losspfend, :losspfwoa, :interest, :taxon, :miscellaneous, :pmbl,
                        :cmbl, :ntbl, :cscosarfrncnnt2
                    ) `
                        , [arr[0]]
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
                        })
                );
            }
        });
    });
