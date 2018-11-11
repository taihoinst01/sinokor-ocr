// Oracle Config
// ��ġ�� : npm ���� �� ��� cmdâ���� git config http.sslVerify false ����
var dbConfig = {
    user: process.env.NODE_ORACLEDB_USER || "koreanre5",
    password: process.env.NODE_ORACLEDB_PASSWORD || "koreanre01",
    connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "172.16.53.147/koreanreocr5",
    externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
    poolMax: 30,
    poolMin: 10
};

/* MariaDB Config
var dbConfig = {
    connectionLimit: 10,
    host: '172.16.53.142',
    port: 3307,
    user: 'root',
    password: '1234',
    database: 'koreanreICR'
};
*/

module.exports = dbConfig;

