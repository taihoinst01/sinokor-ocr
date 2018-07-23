var count = {
    startQuery: "SELECT COUNT(*) AS cnt FROM ( ",
    endQuery:   " ) AS COUNTQUERY "
}

var sessionConfig = {
    loginQuery: "SELECT * FROM TBL_ICR_USER WHERE USERID = ?",
    lastLoginUpdateQuery: "UPDATE TBL_ICR_USER SET lastLoginDate = now() WHERE USERID = ?"
}

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
        "VALUES(?, ?, ?, ?, now(), 0)",
    deleteUser:
        "DELETE FROM TBL_ICR_USER WHERE SEQNUM = ?",
    updatePw:
        "UPDATE TBL_ICR_USER SET USERPW = ? WHERE SEQNUM = ?"
};

var dbcolumnsConfig = {
    selDBColumns:
        "SELECT " +
            "seqNum, koKeyword, enKeyword " +
        "FROM " +
            "tbl_extraction_keyword"
};

var batchLearningConfig = {
    selectBatchLearningDataList: 
        `SELECT F.SEQNUM, F.IMG_ID, F.FILE_PATH, F.ORI_FILE_NAME, F.SVR_FILE_NAME, F.FILE_EXT, 
                F.FILE_SIZE, F.CONTENT_TYPE, F.FILE_TYPE, F.FILE_WIDTH, F.FILE_HEIGHT,
                A.STATUS, A.IMG_FILE_ST_NO, A.IMG_FILE_END_NO, A.CSCO_NM, A.CT_NM,  
                DATE_FORMAT(A.INS_ST_DT, '%Y-%m-%d %H:%i:%s') AS INS_ST_DT, 
                DATE_FORMAT(A.INS_END_DT, '%Y-%m-%d %H:%i:%s') AS INS_END_DT, 
                A.CUR_CD, A.PRE, A.COM, A.BRKG, A.TXAM, A.PRRS_CF, A.PRRS_RLS, A.LSRES_CF, 
                A.LSRES_RLS, A.CLA, A.EXEX, A.SVF, A.CAS, A.NTBL, A.CSCO_SA_RFRN_CNNT2
	       FROM tbl_icr_file F
		        LEFT OUTER JOIN tbl_batch_learn_data A ON A.IMG_ID = F.IMG_ID
	      WHERE A.STATUS != 'D' `,
    selectBatchLearningData:
        `SELECT F.SEQNUM, F.IMG_ID, F.FILE_PATH, F.ORI_FILE_NAME, F.SVR_FILE_NAME, F.FILE_EXT, 
                F.FILE_SIZE, F.CONTENT_TYPE, F.FILE_TYPE, F.FILE_WIDTH, F.FILE_HEIGHT,
                A.STATUS, A.IMG_FILE_ST_NO, A.IMG_FILE_END_NO, A.CSCO_NM, A.CT_NM,  
                DATE_FORMAT(A.INS_ST_DT, '%Y-%m-%d %H:%i:%s') AS INS_ST_DT, 
                DATE_FORMAT(A.INS_END_DT, '%Y-%m-%d %H:%i:%s') AS INS_END_DT, 
                A.CUR_CD, A.PRE, A.COM, A.BRKG, A.TXAM, A.PRRS_CF, A.PRRS_RLS, A.LSRES_CF, 
                A.LSRES_RLS, A.CLA, A.EXEX, A.SVF, A.CAS, A.NTBL, A.CSCO_SA_RFRN_CNNT2
	       FROM tbl_icr_file F
		        LEFT OUTER JOIN tbl_batch_learn_data A ON A.IMG_ID = F.IMG_ID
	      WHERE F.IMG_ID = ?
            AND A.STATUS != 'D' `,
    selectFileNameList:
        `SELECT FILE_PATH
           FROM tbl_icr_file`,
    selectFileData:
        `SELECT SEQNUM, IMG_ID, FILE_PATH, ORI_FILE_NAME, SVR_FILE_NAME, FILE_EXT, FILE_SIZE, CONTENT_TYPE, FILE_TYPE, FILE_WIDTH, FILE_HEIGHT, REG_ID, REG_DATE
           FROM tbl_icr_file
          WHERE IMG_ID = ?
          ORDER BY SEQNUM DESC`,
    insertBatchLearningBaseData:
        "INSERT INTO tbl_batch_learn_data (IMG_ID, STATUS, REG_ID, REG_DATE) " +
        "VALUES (?, 'N', ?, now())",
    insertBatchLearningData:
        "INSERT INTO tbl_batch_learn_data (IMG_ID, ORI_FILE_NAME, STATUS, IMG_FILE_ST_NO, IMG_FILE_END_NO, CSCO_NM, CT_NM, INS_ST_DT, INS_END_DT, CUR_CD, PRE, COM, " +
        "BRKG, TXAM, PRRS_CF, PRRS_RLS, LSRES_CF, LSRES_RLS, CLA, EXEX, SVF, CAS, NTBL, CSCO_SA_RFRN_CNNT2, REG_ID, REG_DATE) " +
        "VALUES (?, ?, 'N', ?, ?, ?, ?, ?, ?, ?, ?, ?, " +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())",
    insertFileInfo:
        "INSERT INTO TBL_ICR_FILE (IMG_ID, FILE_PATH, ORI_FILE_NAME, SVR_FILE_NAME, FILE_EXT, FILE_SIZE, CONTENT_TYPE, FILE_TYPE, REG_ID, REG_DATE) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, now())",
    selectIsExistWordToSymspell:
        "SELECT keyword, frequency " +
        "FROM tbl_icr_symspell " +
        "WHERE keyword=?",
    insertSymspell:
        "INSERT INTO tbl_icr_symspell(keyword, frequency) VALUES (?,1)",
    updataSymsepll:
        "UPDATE tbl_icr_symspell SET frequency=frequency+1 WHERE keyword=?",
    deleteBatchLearningData:
        "UPDATE tbl_batch_learn_data SET STATUS = 'D' WHERE IMG_ID IN "
}

var uiLearningConfig = {
    insertTextClassification:
        "INSERT INTO TBL_TEXT_CLASSIFICATION_TRAIN(TEXT, CLASS) VALUES (?, ?)",
    insertLabelMapping:
        "INSERT INTO TBL_LABEL_MAPPING_TRAIN(TEXT, CLASS) VALUES (?, ?)",
    selectLabel:
        "SELECT KOKEYWORD, ENKEYWORD, LABEL FROM TBL_EXTRACTION_KEYWORD WHERE KOKEYWORD = ?",
    insertDomainDic:
        "INSERT INTO TBL_OCR_DOMAIN_DIC_TRANS(ORIGINWORD, FRONTWORD, CORRECTEDWORDS, REARWORD) VALUES(?, ?, ?, ?)",
    selectDomainDic:
        "SELECT ORIGINWORD, FRONTWORD, CORRECTEDWORDS, REARWORD FROM TBL_OCR_DOMAIN_DIC_TRANS WHERE ORIGINWORD = ? AND FRONTWORD = ? AND REARWORD = ?",
    insertTypo:
        "INSERT INTO TBL_ICR_SYMSPELL(KEYWORD, FREQUENCY) VALUES(?, 1)",
    selectTypo:
        "SELECT KEYWORD, FREQUENCY FROM TBL_ICR_SYMSPELL WHERE KEYWORD = ?",
    updateTypo:
        "UPDATE TBL_ICR_SYMSPELL SET FREQUENCY = FREQUENCY + 1 WHERE KEYWORD = ?",
    selectColumn:
        "SELECT KOKEYWORD, ENKEYWORD, LABEL FROM TBL_EXTRACTION_KEYWORD"
}

module.exports = {
    count: count,
    sessionConfig: sessionConfig,
    queryConfig: queryConfig,
    userMngConfig: userMngConfig,
    dbcolumnsConfig: dbcolumnsConfig,
    batchLearningConfig: batchLearningConfig,
    uiLearningConfig: uiLearningConfig
}