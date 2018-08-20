var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');

let sqltext = `SELECT EXPORT_SENTENCE_SID(:COND) SID FROM DUAL`;

exports.select = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i in req) {
                var sid = "";
                locSplit = req[i].location.split(",");
                sid += locSplit[0] + "," + locSplit[1];

                let result = await conn.execute(sqltext, [req[i].text]);

                if (result.rows[0] != null) {
                    sid += "," + result.rows[0].SID;
                }
                req[i].sid = sid;
            }

            return done(null, req);
        } catch (err) { 
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}


