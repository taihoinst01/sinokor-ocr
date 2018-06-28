var queryConfig = {
    selectDbColumns:
        "SELECT " + 
            "* " +
        "FROM " +
            "TBL_sinokor_dbColumns " +
        "WHERE " +
            "formName = @formName",
    insertfvClassification:
        "INSERT INTO TBL_sinokor_fvClassification " +
        "values (@x,@y,@text,@isFixed)",
    insertformClassification:
        "INSERT INTO TBL_sinohor_formClassification " +
        "values (@a,@b,@c,@d,@e,@f,@g,@h,@i,@j,@k,@l,@m,@n,@o,@p,@q,@r,@s,@t,@u,@v,@w,@x,@y,@z,@etc,@form)",
    insertsrClassification:
        "INSERT INTO TBL_sinokor_srClassification " +
        "values (@x,@y,@text,@columnNo)"
};

var userMngConfig = {
    selUserList:
        "SELECT seqNum, userId, auth, email, DATE_FORMAT(joinDate,'%Y-%m-%d') joinDate, " +
        "DATE_FORMAT(lastLoginDate,'%Y-%m-%d %H:%i:%S') lastLoginDate, icrUseCount " +
        "FROM TBL_ICR_USER",
    insertUser:
        "INSERT INTO TBL_ICR_USER (USERID, USERPW, AUTH, EMAIL, JOINDATE, ICRUSECOUNT) " +
        "VALUES(?, ?, ?, ?, now(), '0')",
    deleteUser:
        "DELETE FROM TBL_ICR_USER WHERE SEQNUM = ?",
    updatePw:
        "UPDATE TBL_ICR_USER SET PW = ? WHERE SEQNUM = ?"
};

module.exports = {
    queryConfig: queryConfig,
    userMngConfig: userMngConfig
}