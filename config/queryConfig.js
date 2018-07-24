/*var queryConfig = {
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
};*/

var count = {
    startQuery: "SELECT COUNT(*) AS cnt FROM ( ",
    endQuery: " ) AS COUNTQUERY "
}

var sessionConfig = {
    loginQuery:
        `SELECT
            *
         FROM
            tbl_ocr_comm_user
         WHERE
            userId = :id `,
    lastLoginUpdateQuery:
        `UPDATE
            tbl_ocr_comm_user
         SET
            lastLoginDate = sysdate
         WHERE
            userId = :id `
}

var userMngConfig = {
    selUserList:
        `SELECT
            seqNum, userId, auth, email, TO_DATE(joinDate,'YYYY-MM-DD') AS joinDate,
            "TO_DATE(lastLoginDate,'YYYY-MM-DD hh24:mi:ss') AS lastLoginDate, ocrUseCount
         FROM
            tbl_ocr_comm_user `,
    insertUser:
        `INSERT INTO
            tbl_ocr_comm_user (userId, userPw, auth, email, joinDate, ocrUseCount)
         VALUES
            (:userId, :userPw, :auth, :email, sysdate, 0) `,
    deleteUser:
        `DELETE FROM
            tbl_ocr_comm_user
         WHERE
            seqNum = :seqNum `,
    updatePw:
        `UPDATE
            tbl_ocr_comm_user
         SET
            userPw = :userPw
         WHERE
            seqNum = :seqNum `
};

var dbcolumnsConfig = {
    selDBColumns:
        `SELECT
            seqNum, koKeyword, enKeyword
        FROM
            "tbl_extraction_keyword `
};

var batchLearningConfig = {
    selectBatchLearningDataList:
        `SELECT
            F.seqNum, F.imgId, F.filePath, F.originFileName, F.serverFileName, F.fileExtension,
            F.fileSize, F.contentType, F.fileType, F.fileWidth, F.fileHeight,
            A.status, A.imgFileStartNo, A.imgFileEndNo, A.csconm, A.ctnm,
            TO_DATE(A.insstdt, 'YYYY-MM-DD hh24:mi:ss') AS insstdt,
            TO_DATE(A.insenddt, 'YYYY-MM-DD hh24:mi:ss') AS insenddt,
            A.curcd, A.pre, A.com, A.brkg, A.txam, A.prrscf, A.prrsrls, A.lsrescf,
            A.lsresrls, A.cla, A.exex, A.svf, A.cas, A.ntbl, A.cscosarfrncnnt2
	     FROM
            tbl_ocr_file F
		    LEFT OUTER JOIN 
                tbl_batch_learn_data A
            ON
                A.imgId = F.imgId
	     WHERE
            A.status != 'D' `,
    selectBatchLearningData:
        `SELECT
            F.seqNum, F.imgId, F.filePath, F.originFileName, F.serverFileName, F.fileExtension,
            F.fileSize, F.contentType, F.fileType, F.fileWidth, F.fileHeight,
            A.status, A.imgFileStartNo, A.imgFileEndNo, A.csconm, A.ctnm,
            TO_DATE(A.insstdt, 'YYYY-MM-DD hh24:mi:ss') AS insstdt,
            TO_DATE(A.insenddt, 'YYYY-MM-DD hh24:mi:ss') AS insenddt,
            A.curcd, A.pre, A.com, A.brkg, A.txam, A.prrscf, A.prrsrls, A.lsrescf,
            A.lsresrls, A.cla, A.exex, A.svf, A.cas, A.ntbl, A.cscosarfrncnnt2
	     FROM
            tbl_ocr_file F
		    LEFT OUTER JOIN
                tbl_batch_learn_data A
            ON
                A.imgId = F.imgId
	     WHERE
            F.imgId = :imgId AND A.status != 'D' `,
    selectFileNameList:
            `SELECT 
                filePath
             FROM
                tbl_ocr_file `,
    selectFileData:
        `SELECT
            seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize,
            contentType, fileType, fileWidth, fileHeight, regId, regDate
         FROM
             tbl_ocr_file
         WHERE
            imgId = :imgId
         ORDER BY
            seqNum desc `,
    insertBatchLearningBaseData:
        `INSERT INTO
            tbl_batch_learn_data (imgId, status, regId, regDate)
         VALUES
            (:imgId, 'N', :regId, sysdate) `,
    insertBatchLearningData:
        `INSERT INTO
            tbl_batch_learn_data (imgId, status, imgFileStartNo, imgFileEndNo, csconm, ctnm, insstdt, insenddt,
            curcd, pre, com, brkg, txam, prrscf, prrsrls, lsrescf, lsresrls, cla, exex, svf, cas, ntbl, cscosarfrncnnt2, regId, regDate)
         VALUES
            (:imgId, :originFileName, 'N', :imgFileStartNo, :imgFileEndNo, :csconm, :ctnm, :insstdt, :insenddt,
            :curcd, :pre, :com, :brkg, :txam, :prrscf, :prrsrls, :lsrescf, :lsresrls, :cla, :exex, :svf, :cas, :ntbl, :cscosarfrncnnt2, :regId, sysdate) `,
    insertFileInfo:
        `INSERT INTO
            tbl_ocr_file(seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize, contentType, fileType, regId, regDate)
         VALUES
            (ocrfile_seq.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `,
    selectIsExistWordToSymspell:
        `SELECT
            keyword, frequency
         FROM
            tbl_ocr_symspell
         WHERE
            keyword = :keyWord `,
    insertSymspell:
        `INSERT INTO
            tbl_ocr_symspell(seqNum, keyword, frequency)
         VALUES
            (keyword_seq.nextval, :keyWord, 1) `,
    updataSymsepll:
        `UPDATE
            tbl_ocr_symspell
         SET
            frequency=frequency+1
         WHERE
            keyword = :keyWord `,
    deleteBatchLearningData:
        `UPDATE 
            tbl_batch_learn_data
         SET
            status = 'D'
         WHERE imgId IN `
}

var uiLearningConfig = {
    insertTextClassification:
        `INSERT INTO
            TBL_TEXT_CLASSIFICATION_TRAIN(TEXT, CLASS)
         VALUES
            (:text, :class) `,
    insertLabelMapping:
        `INSERT INTO TBL_LABEL_MAPPING_TRAIN(TEXT, CLASS) VALUES (:text, :class) `,
    selectLabel:
        `SELECT KOKEYWORD, ENKEYWORD, LABEL FROM TBL_EXTRACTION_KEYWORD WHERE KOKEYWORD = :koKeyWord `,
    insertDomainDic:
        `INSERT INTO TBL_OCR_DOMAIN_DIC_TRANS(ORIGINWORD, FRONTWORD, CORRECTEDWORDS, REARWORD) VALUES(:originWord, :frontWord, :correctedWords, :rearWord) `,
    selectDomainDic:
        `SELECT ORIGINWORD, FRONTWORD, CORRECTEDWORDS, REARWORD FROM TBL_OCR_DOMAIN_DIC_TRANS WHERE ORIGINWORD = :originWord AND FRONTWORD = :frontWord AND REARWORD = :rearWord `,
    insertTypo:
        `INSERT INTO TBL_OCR_SYMSPELL(KEYWORD, FREQUENCY) VALUES(:keyWord, 1) `,
    selectTypo:
        `SELECT KEYWORD, FREQUENCY FROM TBL_OCR_SYMSPELL WHERE KEYWORD = :keyWord `,
    updateTypo:
        `UPDATE TBL_OCR_SYMSPELL SET FREQUENCY = FREQUENCY + 1 WHERE KEYWORD = :keyWord `,
    selectColumn:
        `SELECT KOKEYWORD, ENKEYWORD, LABEL FROM TBL_EXTRACTION_KEYWORD `
}

module.exports = {
    count: count,
    sessionConfig: sessionConfig,
    //queryConfig: queryConfig,
    userMngConfig: userMngConfig,
    dbcolumnsConfig: dbcolumnsConfig,
    batchLearningConfig: batchLearningConfig,
    uiLearningConfig: uiLearningConfig
}