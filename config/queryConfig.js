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
            A.lsresrls, A.cla, A.exex, A.svf, A.cas, A.ntbl, A.cscosarfrncnnt2,
            A.regId, TO_DATE(A.regDate, 'YYYY-MM-DD hh24:mi:ss') AS regDate,
            A.updId, TO_DATE(A.updDate, 'YYYY-MM-DD hh24:mi:ss') AS updDate,
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
            (seq_ocr_file.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `,
    insertBatchAnswerFile:
        `INSERT INTO TBL_BATCH_ANSWER_FILE (IMGID,PAGENUM,FILEPATH,TOTALCOUNT) values (:imgId, :pageNum, :filePath, :totalCount) `,
    insertBatchAnswerData:
        `INSERT INTO TBL_BATCH_ANSWER_DATA (
            IMGID, IMGFILESTARTNO, IMGFILEENDNO, ENTRYNO, STATEMENTDIV, CONTRACTNUM, OGCOMPANYCODE, OGCOMPANYNAME, BROKERCODE, BROKERNAME,
            CTNM, INSSTDT, INSENDDT, UY, CURCD, PAIDPERCENT, PAIDSHARE, OSLPERCENT, OSLSHARE, GROSSPM, PM, PMPFEND, PMPFWOS, XOLPM,
            RETURNPM, GROSSCN, CN, PROFITCN, TAX, OVERRIDINGCOM, CHARGE, PMRESERVERTD1, PMPMRESERVERD1, PMRESERVERTD2, PMPMRESERVERD2,
            CLAIM, LOSSRECOVERY, CASHLOSS, CASHLOSSRD, LOSSRR, LOSSRR2, LOSSPFEND, LOSSPFWOA, INTEREST, TAXON, MISCELLANEOUS, PMBL,
            CMBL, NTBL, CSCOSARFRNCNNT2
        ) VALUES (
            :imgId, :imgfilestartno, :imgfileendno, :entryno, :statementdiv, :contractnum, :ogcompanycode, :ogcompanyname, :brokercode, :brokername,
            :ctnm, :insstdt, :insenddt, :uy, :curcd, :paidpercent, :paidshare, :oslpercent, :oslshare, :grosspm, :pm, :pmpfend, :pmpfwos, :xolpm,
            :returnpm, :grosscn, :cn, :profitcn, :tax, :overridingcom, :charge, :pmreservertd1, :pmpmreserverd1, :pmreservertd2, :pmpmreserverd2,
            :claim, :lossrecovery, :cashloss, :cashlossrd, :lossrr, :lossrr2, :losspfend, :losspfwoa, :interest, :taxon, :miscellaneous, :pmbl
            :cmbl, :ntbl, :cscosarfrncnnt2
        ) `,
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
            (seq_ocr_symspell.nextval, :keyWord, 1) `,
    updataSymsepll:
        `UPDATE
            tbl_ocr_symspell
         SET
            frequency=frequency+1
         WHERE
            keyword = :keyWord `,
    updateBatchLearningData:
        `UPDATE tbl_batch_learn_data
         SET
            status = 'Y',
            imgFileStartNo = :imgFileStartNo, imgFileEndNo = :imgFileEndNo, cscoNm = :cscoNm, ctNm = :ctNm,
            insStDt = :insStDt, insEndDt = :insEndDt, curCd = :curCd, pre = :pre, com = :com,
            brkg = :brkg, txam = :txam, prrsCf = :prrsCf, prrsRls = :prrsRls, lsresCf = :lsresCf,
            lsresRls = :lsresRls, cla = :cla, exex = :exex, svf = :svf, cas = :cas, ntbl = :ntbl,
            cscoSaRfrnCnnt2 = :cscoSaRfrnCnnt2, updId = :updId, updDate = sysdate
         WHERE imgId = :imgId`,
    deleteBatchLearningData:
        `UPDATE 
            tbl_batch_learn_data
         SET
            status = 'D'
         WHERE
            imgId IN `,
    selectBatchAnswerFile: 
        `SELECT
            imgId, pageNum, filePath, totalCount
         FROM
            tbl_batch_answer_file 
         WHERE
            filePath IN `,
    selectBatchAnswerDataToImgId:
        `SELECT
            imgId, imgFileStartNo, imgFileEndNo
         FROM
            TBL_BATCH_ANSWER_DATA
        WHERE
            imgId IN `
}

var uiLearningConfig = {
    insertTextClassification:
        `INSERT INTO
            tbl_text_classification_train(seqNum, text, class, regDate)
         VALUES
            (seq_text_classification_train.nextval, :text, :class, sysdate) `,
    insertLabelMapping:
        `INSERT INTO
            tbl_label_mapping_train(seqNum, text, class, regDate)
         VALUES
            (seq_label_mapping_train.nextval, :text, :class, sysdate) `,
    selectLabel:
        `SELECT
            koKeyWord, enKeyWord, label
         FROM
            tbl_extraction_keyword
         WHERE
            koKeyWord = :koKeyWord `,
    insertDomainDic:
        `INSERT INTO
            tbl_ocr_domain_dic_trans(seqNum, originWord, frontWord, correctedWords, rearWord)
         VALUES
            (seq_ocr_domain_dic_trans.nextval, :originWord, :frontWord, :correctedWords, :rearWord) `,
    selectDomainDic:
        `SELECT
            originWord, frontWord, correctedWords, rearWord
         FROM
            tbl_ocr_domain_dic_trans
         WHERE
            originWord = :originWord AND frontWord = :frontWord AND rearWord = :rearWord `,
    insertTypo:
        `INSERT INTO
            tbl_ocr_symspell(seqNum, keyword, frequency)
         VALUES
            (seq_ocr_symspell.nextval, :keyWord, 1) `,
    selectTypo:
        `SELECT
            keyword, frequency
         FROM
            tbl_ocr_symspell
         WHERE
            keyword = :keyWord `,
    updateTypo:
        `UPDATE
            tbl_ocr_symspell
         SET
            frequency = frequency + 1
         WHERE
            keyword = :keyWord `,
    selectColumn:
        `SELECT
            koKeyWord, enKeyWord, label
         FROM
            tbl_extraction_keyword `
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