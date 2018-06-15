var dbConfig = {
    user: 'taihoinst',
    password: 'taiho9788!',
    server: 'taiholab.database.windows.net',
    database: 'ocrdemo',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true
    }
};

module.exports = dbConfig;