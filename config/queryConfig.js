var count = {
    startQuery: "SELECT COUNT(*) AS cnt FROM ( ",
    endQuery: " ) "
};

var sessionConfig = {
    loginQuery:
        `SELECT
            seqnum, userId, userPw, auth, email, ocrUseCount,
            TO_CHAR(joinDate, 'yyyy-mm-dd hh:mi:ss') AS joinDate, 
            TO_CHAR(lastLoginDate, 'yyyy-mm-dd hh:mi:ss') AS lastLoginDate
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
            userId = :id `,
    leftSideBarInvoiceRegistration:
        `SELECT COUNT(*) AS CNT
           FROM TBL_DOCUMENT
          WHERE APPROVALSTATE = 'R'
            AND APPROVALREPORTER = :id 
        `,
    leftSideBarMyApproval:
        ` SELECT COUNT(*) AS CNT
            FROM TBL_DOCUMENT
           WHERE APPROVALSTATE = 'P'
             AND DOCUMENTMANAGER = :id
        `,
    updateOcrCount:
        ` UPDATE TBL_OCR_COMM_USER
             SET
                OCRUSECOUNT = OCRUSECOUNT + :ocrCount
            WHERE 
                USERID = :userId
        `
};

var userMngConfig = {
    selUserList:
        `SELECT
            A.seqNum, A.userId, A.auth, A.email, A.note, A.scanApproval, A.middleApproval, A.lastApproval, A.ocrUseCount,
            (SELECT 
                B.userId 
             FROM
                tbl_ocr_comm_user B
             WHERE
                B.seqNum = A.highApprovalId) AS highApprovalId,
            TO_CHAR(A.joinDate,'YYYY-MM-DD') AS joinDate,
            TO_CHAR(A.lastLoginDate,'YYYY-MM-DD hh24:mi:ss') AS lastLoginDate
         FROM
            tbl_ocr_comm_user A `,
    insertUser:
        `INSERT INTO
            tbl_ocr_comm_user (seqNum, userId, userPw, auth, email, note, scanApproval, middleApproval, lastApproval, highApprovalId, joinDate, ocrUseCount)
         VALUES
            (seq_ocr_comm_user.nextval, :userId, :userPw, 'USER', :email, :note, :scanApproval, :middleApproval, :lastApproval, :highApprovalId, sysdate, 0) `,
    updateUser:
        `UPDATE
            tbl_ocr_comm_user
         SET `,
    deleteUser:
        `DELETE FROM
            tbl_ocr_comm_user
         WHERE
            seqNum = :seqNum `,
    headerUserPopSelectPw:
        `SELECT COUNT(USERID) AS CNT
           FROM tbl_ocr_comm_user `
};

var dbcolumnsConfig = {
    selDBColumns:
        `SELECT
            seqNum, koKeyword, enKeyword
         FROM
            tbl_extraction_keyword `,
    selectColMappingCls:
        `SELECT
            seqNum, colName, colType, colNum
         FROM
            tbl_column_mapping_cls `,
    selectEntryMappingCls:
        `SELECT
            SEQNUM, COLNAME, COLTYPE, COLNUM, OLDCOLTYPE
         FROM
            TBL_ENTRY_MAPPING_CLS`
};

var invoiceRegistrationConfig = {
    selectDocumentList:
        `SELECT SEQNUM, DOCNUM, PAGECNT, APPROVALSTATE, DEADLINEDT, REGDT, FAOTEAM, FAOPART, APPROVALREPORTER, DOCUMENTMANAGER, MEMO,
                DECODE(APPROVALSTATE, 'P', 'P', 'C', 'C', 'R', 'R', 'U', 'U', '') AS APPROVALSTATE_STR
            FROM TBL_DOCUMENT
           WHERE 1=1 `,
    selectDocumentDtlList:
        `SELECT A.SEQNUM, 
                A.DOCNUM, A.PAGECNT, A.APPROVALSTATE, A.DEADLINEDT, A.REGDT, A.FAOTEAM, A.FAOPART, A.APPROVALREPORTER, A.DOCUMENTMANAGER, A.MEMO,
                B.SEQNUM AS SEQNUM_DTL,
                B.IMGID, B.IMGFILESTARTNO, B.IMGFILEENDNO, B.ENTRYNO, B.STATEMENTDIV, B.CONTRACTNUM, 
                B.OGCOMPANYCODE, B.OGCOMPANYCODECOORDI, B.OGCOMPANYNAME, B.OGCOMPANYNAMECOORDI, 
                B.BROKERCODE, B.BROKERCODECOORDI, B.BROKERNAME, B.BROKERNAMECOORDI, 
                B.CTNM, B.CTNMCOORDI, B.INSSTDT, B.INSSTDTCOORDI, B.INSENDDT, B.INSENDDTCOORDI, B.UY, B.UYCOORDI, 
                B.CURCD, B.CURCDCOORDI, B.PAIDPERCENT, B.PAIDPERCENTCOORDI, B.PAIDSHARE, B.PAIDSHARECOORDI, 
                B.OSLPERCENT, B.OSLPERCENTCOORDI, B.OSLSHARE, B.OSLSHARECOORDI, B.GROSSPM, B.GROSSPMCOORDI, 
                B.PM, B.PMCOORDI, B.PMPFEND, B.PMPFENDCOORDI, B.PMPFWOS, B.PMPFWOSCOORDI, B.XOLPM, B.XOLPMCOORDI, 
                B.RETURNPM, B.RETURNPMCOORDI, B.GROSSCN, B.GROSSCNCOORDI, B.CN, B.CNCOORDI, B.PROFITCN, B.PROFITCNCOORDI, 
                B.BROKERAGE, B.BROKERAGECOORDI, B.TAX, B.TAXCOORDI, B.OVERRIDINGCOM, B.OVERRIDINGCOMCOORDI, B.CHARGE, B.CHARGECOORDI, 
                B.PMRESERVERTD1, B.PMRESERVERTD1COORDI, B.PFPMRESERVERTD1, B.PFPMRESERVERTD1COORDI, 
                B.PMRESERVERTD2, B.PMRESERVERTD2COORDI, B.PFPMRESERVERTD2, B.PFPMRESERVERTD2COORDI, 
                B.CLAIM, B.CLAIMCOORDI, B.LOSSRECOVERY, B.LOSSRECOVERYCOORDI, B.CASHLOSS, B.CASHLOSSCOORDI, B.CASHLOSSRD, B.CASHLOSSRDCOORDI, 
                B.LOSSRR, B.LOSSRRCOORDI, B.LOSSRR2, B.LOSSRR2COORDI, B.LOSSPFEND, B.LOSSPFENDCOORDI, B.LOSSPFWOA, B.LOSSPFWOACOORDI, 
                B.INTEREST, B.INTERESTCOORDI, B.TAXON, B.TAXONCOORDI, B.MISCELLANEOUS, B.MISCELLANEOUSCOORDI, B.PMBL, B.PMBLCOORDI, B.CMBL, B.CMBLCOORDI, 
                B.NTBL, B.NTBLCOORDI, B.CSCOSARFRNCNNT2, B.CSCOSARFRNCNNT2COORDI 
           FROM TBL_DOCUMENT_DTL B
     LEFT OUTER JOIN TBL_DOCUMENT A ON A.DOCNUM = B.DOCNUM
          WHERE 1=1 `,
    selectDocumentImageList:
        `SELECT A.SEQNUM, A.IMGID, A.FILEPATH, A.ORIGINFILENAME, A.SERVERFILENAME, A.FILEEXTENSION, 
                A.FILESIZE, A.CONTENTTYPE, A.FILETYPE, A.FILEWIDTH, A.FILEHEIGHT, A.REGID A.REGDATE 
           FROM TBL_OCR_FILE_DTL A,
                TBL_DOCUMENT_DTL B
          WHERE A.IMGID = B.IMGID `
};

var myApprovalConfig = {
    selectApprovalList:
        `SELECT SEQNUM, DOCNUM, PAGECNT, APPROVALSTATE, DEADLINEDT, REGDT, FAOTEAM, FAOPART, APPROVALREPORTER, DOCUMENTMANAGER, MEMO,
                DECODE(APPROVALSTATE, 'P', 'P', 'C', 'C', 'R', 'R', 'U', 'U', '') AS APPROVALSTATE_STR
            FROM TBL_DOCUMENT
           WHERE 1=1 `,
    selectApprovalDtlList:
        `SELECT A.SEQNUM, 
                A.DOCNUM, A.PAGECNT, A.APPROVALSTATE, A.DEADLINEDT, A.REGDT, A.FAOTEAM, A.FAOPART, A.APPROVALREPORTER, A.DOCUMENTMANAGER, A.MEMO,
                B.SEQNUM AS SEQNUM_DTL,
                B.IMGID, B.IMGFILESTARTNO, B.IMGFILEENDNO, B.ENTRYNO, B.STATEMENTDIV, B.CONTRACTNUM, 
                B.OGCOMPANYCODE, B.OGCOMPANYCODECOORDI, B.OGCOMPANYNAME, B.OGCOMPANYNAMECOORDI, 
                B.BROKERCODE, B.BROKERCODECOORDI, B.BROKERNAME, B.BROKERNAMECOORDI, 
                B.CTNM, B.CTNMCOORDI, B.INSSTDT, B.INSSTDTCOORDI, B.INSENDDT, B.INSENDDTCOORDI, B.UY, B.UYCOORDI, 
                B.CURCD, B.CURCDCOORDI, B.PAIDPERCENT, B.PAIDPERCENTCOORDI, B.PAIDSHARE, B.PAIDSHARECOORDI, 
                B.OSLPERCENT, B.OSLPERCENTCOORDI, B.OSLSHARE, B.OSLSHARECOORDI, B.GROSSPM, B.GROSSPMCOORDI, 
                B.PM, B.PMCOORDI, B.PMPFEND, B.PMPFENDCOORDI, B.PMPFWOS, B.PMPFWOSCOORDI, B.XOLPM, B.XOLPMCOORDI, 
                B.RETURNPM, B.RETURNPMCOORDI, B.GROSSCN, B.GROSSCNCOORDI, B.CN, B.CNCOORDI, B.PROFITCN, B.PROFITCNCOORDI, 
                B.BROKERAGE, B.BROKERAGECOORDI, B.TAX, B.TAXCOORDI, B.OVERRIDINGCOM, B.OVERRIDINGCOMCOORDI, B.CHARGE, B.CHARGECOORDI, 
                B.PMRESERVERTD1, B.PMRESERVERTD1COORDI, B.PFPMRESERVERTD1, B.PFPMRESERVERTD1COORDI, 
                B.PMRESERVERTD2, B.PMRESERVERTD2COORDI, B.PFPMRESERVERTD2, B.PFPMRESERVERTD2COORDI, 
                B.CLAIM, B.CLAIMCOORDI, B.LOSSRECOVERY, B.LOSSRECOVERYCOORDI, B.CASHLOSS, B.CASHLOSSCOORDI, B.CASHLOSSRD, B.CASHLOSSRDCOORDI, 
                B.LOSSRR, B.LOSSRRCOORDI, B.LOSSRR2, B.LOSSRR2COORDI, B.LOSSPFEND, B.LOSSPFENDCOORDI, B.LOSSPFWOA, B.LOSSPFWOACOORDI, 
                B.INTEREST, B.INTERESTCOORDI, B.TAXON, B.TAXONCOORDI, B.MISCELLANEOUS, B.MISCELLANEOUSCOORDI, B.PMBL, B.PMBLCOORDI, B.CMBL, B.CMBLCOORDI, 
                B.NTBL, B.NTBLCOORDI, B.CSCOSARFRNCNNT2, B.CSCOSARFRNCNNT2COORDI 
           FROM TBL_DOCUMENT_DTL B
     LEFT OUTER JOIN TBL_DOCUMENT A ON A.DOCNUM = B.DOCNUM
          WHERE 1=1 `,
    selectApprovalImageList:
        `SELECT A.SEQNUM, A.IMGID, A.FILEPATH, A.ORIGINFILENAME, A.SERVERFILENAME, A.FILEEXTENSION, 
                A.FILESIZE, A.CONTENTTYPE, A.FILETYPE, A.FILEWIDTH, A.FILEHEIGHT, A.REGID, A.REGDATE 
           FROM TBL_OCR_FILE_DTL A,
                TBL_DOCUMENT_DTL B
          WHERE A.IMGID = B.IMGID `,
    selectUsers:
        `SELECT
            seqnum, userId, userPw, auth, email, ocrUseCount,
            TO_CHAR(joinDate, 'yyyy-mm-dd hh:mi:ss') AS joinDate, 
            TO_CHAR(lastLoginDate, 'yyyy-mm-dd hh:mi:ss') AS lastLoginDate
         FROM
            tbl_ocr_comm_user
         WHERE
            1=1 `,
    updateDocument:
        `UPDATE TBL_DOCUMENT SET `
};

var documentConfig = {};

var batchLearningConfig = {
    updateConvertedImgPath:
        `UPDATE TBL_BATCH_LEARN_DATA
            SET CONVERTEDIMGPATH = :convertedImgPath
          WHERE IMGID = :imgId`,
    selectViewImage:
        `SELECT A.CONVERTEDIMGPATH, A.IMGID, A.FILEPATH, A.FILENAME
           FROM TBL_BATCH_LEARN_DATA A
          WHERE A.IMGID = :imgId `,
    selectViewImageData:
        `SELECT
            T.*
         FROM
            (SELECT 
                A.IMGID, A.IMGFILESTARTNO, A.IMGFILEENDNO, A.ENTRYNO, A.STATEMENTDIV, A.CONTRACTNUM, A.OGCOMPANYCODE, A.OGCOMPANYNAME, 
                A.BROKERCODE, A.BROKERNAME, A.CTNM, A.INSSTDT, A.INSENDDT, A.UY, A.CURCD, A.PAIDPERCENT, A.PAIDSHARE, A.OSLPERCENT, A.OSLSHARE, 
                A.GROSSPM, A.PM, A.PMPFEND, A.PMPFWOS, A.XOLPM, A.RETURNPM, A.GROSSCN, A.CN, A.PROFITCN, A.BROKERAGE, A.TAX, A.OVERRIDINGCOM, 
                A.CHARGE, A.PMRESERVERTD1, A.PFPMRESERVERTD1, A.PMRESERVERTD2, A.PFPMRESERVERTD2, A.CLAIM, A.LOSSRECOVERY, A.CASHLOSS, A.CASHLOSSRD, 
                A.LOSSRR, A.LOSSRR2, A.LOSSPFEND, A.LOSSPFWOA, A.INTEREST, A.TAXON, A.MISCELLANEOUS, A.PMBL, A.CMBL, A.NTBL, A.CSCOSARFRNCNNT2,
                B.PAGENUM, B.TOTALCOUNT, SUBSTR(B.FILEPATH, INSTR(B.FILEPATH, '/', -1) + 1, LENGTH(B.FILEPATH)) AS FILEPATH
            FROM
                TBL_BATCH_ANSWER_DATA A, TBL_BATCH_ANSWER_FILE B
            WHERE
                B.IMGID = A.IMGID) T
         WHERE
            T.IMGID = : imgId `,
    selectBatchLearningDataList:
        `SELECT A.IMGID, A.STATUS, A.ENTRYNO, A.STATEMENTDIV, A.CONTRACTNUM, A.OGCOMPANYCODE, A.OGCOMPANYNAME, 
                A.BROKERCODE, A.BROKERNAME, A.CTNM, A.INSSTDT, A.INSENDDT, A.UY, A.CURCD, A.PAIDPERCENT, A.PAIDSHARE, 
                A.OSLPERCENT, A.OSLSHARE, A.GROSSPM, A.PM, A.PMPFEND, A.PMPFWOS, A.XOLPM, A.RETURNPM, A.GROSSCN, A.CN, 
                A.PROFITCN, A.BROKERAGE, A.TAX, A.OVERRIDINGCOM, A.CHARGE, A.PMRESERVERTD, A.PFPMRESERVERTD, A.PMRESERVERTD2, A.PFPMRESERVERTD2, 
                A.CLAIM, A.LOSSRECOVERY, A.CASHLOSS, A.CASHLOSSRD, A.LOSSRR, A.LOSSRR2, A.LOSSPFEND, A.LOSSPFWOA, 
                A.INTEREST, A.TAXON, A.MISCELLANEOUS, A.PMBL, A.CMBL, A.NTBL, A.CSCOSARFRNCNNT2, A.REGDATE, A.SUBNUM, A.CURUNIT, 
                A.CONVERTEDIMGPATH, A.FILENAME, A.FILEPATH, A.EXPORTTYPE 
        FROM TBL_BATCH_LEARN_DATA A
        WHERE A.STATUS != 'D' `,
    //selectBatchLearningDataList:
    //    `SELECT
    //        F.seqNum, F.imgId, F.filePath, F.originFileName, F.serverFileName, F.fileExtension,
    //        F.fileSize, F.contentType, F.fileType, F.fileWidth, F.fileHeight,
    //        A.status, A.entryNo, A.statementDiv, A.contractNum, A.ogCompanyCode, A.ogCompanyName, A.brokerCode,
    //        A.brokerName, A.ctnm, A.insstdt, A.insenddt, A.uy, A.curcd, A.paidPercent, A.paidShare, A.oslPercent,
    //        A.oslShare, A.grosspm, A.pm, A.pmPFEnd, A.pmPFWos, A.xolPm, A.returnPm, A.grosscn, A.cn, A.profitcn,
    //        A.brokerAge, A.tax, A.overridingCom, A.charge, A.pmReserveRTD, A.pfPmReserveRTD,A.pmReserveRTD2,
    //        A.pfPmReserveRTD2, A.claim, A.lossRecovery, A.cashLoss, A.cashLossRD, A.lossRR, A.lossRR2, A.lossPFEnd,
    //        A.lossPFWoa, A.interest, A.taxOn, A.miscellaneous, A.pmbl, A.cmbl, A.ntbl, A.cscosarfrncnnt2,          
    //        A.regDate,
    //        (select max(ASOGCOMPANYNAME) from TBL_CONTRACT_MAPPING where EXTOGCOMPANYNAME = A.ogCompanyName and EXTCTNM = A.ctnm) as OGCONTRACTNAME,
    //        (select max(ASCTNM) from TBL_CONTRACT_MAPPING where EXTOGCOMPANYNAME = A.ogCompanyName and EXTCTNM = A.ctnm) as CONTRACTNAMESUMMARY,
    //        A.curunit
	//  FROM
    //        tbl_ocr_file F
	//  LEFT OUTER JOIN 
    //            tbl_batch_learn_data A
    //        ON
    //            A.imgId = F.imgId
	//  WHERE
    //        A.status != 'D' `,
    selectBatchLearningData:
        `SELECT A.IMGID, A.STATUS, A.ENTRYNO, A.STATEMENTDIV, A.CONTRACTNUM, A.OGCOMPANYCODE, A.OGCOMPANYNAME, 
                A.BROKERCODE, A.BROKERNAME, A.CTNM, A.INSSTDT, A.INSENDDT, A.UY, A.CURCD, A.PAIDPERCENT, A.PAIDSHARE, 
                A.OSLPERCENT, A.OSLSHARE, A.GROSSPM, A.PM, A.PMPFEND, A.PMPFWOS, A.XOLPM, A.RETURNPM, A.GROSSCN, A.CN, 
                A.PROFITCN, A.BROKERAGE, A.TAX, A.OVERRIDINGCOM, A.CHARGE, A.PMRESERVERTD, A.PFPMRESERVERTD, A.PMRESERVERTD2, A.PFPMRESERVERTD2, 
                A.CLAIM, A.LOSSRECOVERY, A.CASHLOSS, A.CASHLOSSRD, A.LOSSRR, A.LOSSRR2, A.LOSSPFEND, A.LOSSPFWOA, 
                A.INTEREST, A.TAXON, A.MISCELLANEOUS, A.PMBL, A.CMBL, A.NTBL, A.CSCOSARFRNCNNT2, A.REGDATE, A.SUBNUM, A.CURUNIT, 
                A.CONVERTEDIMGPATH, A.FILENAME, A.FILEPATH, A.EXPORTTYPE 
        FROM TBL_BATCH_LEARN_DATA A
        WHERE A.STATUS != 'D'
          AND A.IMGID = :imgId `,
    selectFileNameList:
        `SELECT 
            FILEPATH
         FROM
            TBL_BATCH_LEARN_DATA
        WHERE STATUS != 'D' `,
    //selectFileData:
    //    `SELECT
    //        seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize,
    //        contentType, fileType, fileWidth, fileHeight, regId, regDate
    //     FROM
    //         tbl_ocr_file
    //     WHERE
    //        imgId = :imgId
    //     ORDER BY
    //        seqNum desc `,
    insertBatchLearningBaseData:
        `INSERT INTO
            tbl_batch_learn_data (imgId, status, regDate, CONVERTEDIMGPATH, FILENAME, FILEPATH)
         VALUES
            (:imgId, 'N', sysdate, :convertedImgPath, :fileName, :filePath) `,
    insertBatchLearningData:
        `INSERT INTO
            tbl_batch_learn_data (imgId, status, entryNo, statementDiv, contractNum, ogCompanyCode, ogCompanyName, brokerCode,
            brokerName, ctnm, insstdt, insenddt, uy, curcd, paidPercent, paidShare, oslPercent, oslShare, grosspm, pm, pmPFEnd,
            pmPFWos, xolPm, returnPm, grosscn, cn, profitcn, brokerAge, tax, overridingCom, charge, pmReserveRTD, pfPmReserveRTD,
            pmReserveRTD2, pfPmReserveRTD2, claim, lossRecovery, cashLoss, cashLossRD, lossRR, lossRR2, lossPFEnd, lossPFWoa,
            interest, taxOn, miscellaneous, pmbl, cmbl, ntbl, cscosarfrncnnt2, subNum, exporttype, filename, filepath, regDate)
         VALUES
            (:imgId, 'N', :entryNo, :statementDiv, :contractNum, :ogCompanyCode, :ogCompanyName, :brokerCode,
            :brokerName, :ctnm, :insstdt, :insenddt, :uy, :curcd, :paidPercent, :paidShare, :oslPercent, :oslShare, :grosspm, :pm, :pmPFEnd,
            :pmPFWos, :xolPm, :returnPm, :grosscn, :cn, :profitcn, :brokerAge, :tax, :overridingCom, :charge, :pmReserveRTD, :pfPmReserveRTD,
            :pmReserveRTD2, :pfPmReserveRTD2, :claim, :lossRecovery, :cashLoss, :cashLossRD, :lossRR, :lossRR2, :lossPFEnd, :lossPFWoa,
            :interest, :taxOn, :miscellaneous, :pmbl, :cmbl, :ntbl, :cscosarfrncnnt2, :subNum, :exporttype, :filename, :filepath, sysdate) `,
    insertFileInfo:
        `INSERT INTO
            tbl_ocr_file(seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize, contentType, fileType, regId, regDate)
         VALUES
            (seq_ocr_file.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `,
    insertFileDtlInfo:
        `INSERT INTO
            tbl_ocr_file_dtl(seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize, contentType, fileType, regId, regDate)
         VALUES
            (seq_ocr_file_dtl.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `,
    insertBatchAnswerFile:
        `INSERT INTO
            tbl_batch_answer_file (imgId,pageNum,filePath,totalCount)
         VALUES
            (:imgId, :pageNum, :filePath, :totalCount) `,
    insertBatchAnswerData:
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
        `UPDATE
            tbl_batch_learn_data
         SET
            status = :status,
            entryNo = :entryNo, statementDiv = :statementDiv, contractNum = :contractNum, ogCompanyCode = :ogCompanyCode,
            ogCompanyName = :ogCompanyName, brokerCode = :brokerCode, brokerName = :brokerName, ctnm = :ctnm, insstdt = :insstdt,
            insenddt = :insenddt, uy = :uy, curcd = :curcd, paidPercent = :paidPercent, paidShare = :paidShare, oslPercent = :oslPercent,
            oslShare = :oslShare, grosspm = :grosspm, pm = :pm, pmPFEnd = :pmPFEnd, pmPFWos = :pmPFWos, xolPm = :xolPm, returnPm = :returnPm,
            grosscn = :grosscn, cn = :cn, profitcn = :profitcn, brokerAge = :brokerAge, tax = :tax, overridingCom = :overridingCom,
            charge = :charge, pmReserveRTD = :pmReserveRTD, pfPmReserveRTD = :pfPmReserveRTD, pmReserveRTD2 = :pmReserveRTD2,
            pfPmReserveRTD2 = :pfPmReserveRTD2, claim = :claim, lossRecovery = :lossRecovery, cashLoss = :cashLoss, cashLossRD = :cashLossRD,
            lossRR = :lossRR, lossRR2 = :lossRR2, lossPFEnd = :lossPFEnd, lossPFWoa = :lossPFWoa, interest = :interest, taxOn = :taxOn,
            miscellaneous = :miscellaneous, pmbl = :pmbl, cmbl = :cmbl, ntbl = :ntbl, cscosarfrncnnt2 = :cscosarfrncnnt2, exporttype = :exporttype,
            filename = :filename, filepath = :filepath
         WHERE
            imgId IN `,
    deleteBatchLearningData:
        `UPDATE 
            tbl_batch_learn_data
         SET
            status = 'D'
         WHERE imgId IN `,
    selectBatchAnswerFile:
        `SELECT
            imgId, pageNum, filePath, totalCount
         FROM
          (SELECT
            imgId, pageNum, SUBSTR(filePath, INSTR(filePath, '/', -1) + 1, LENGTH(filePath)) AS filePath, totalCount
          FROM
            tbl_batch_answer_file )
         WHERE filePath IN `,
    selectBatchAnswerDataToImgId:
        `SELECT
            imgId, imgFileStartNo, imgFileEndNo
         FROM
            tbl_batch_answer_data
        WHERE
            imgId IN `,
    compareBatchLearningData:
        `SELECT
            imgId, imgFileStartNo, imgFileEndNo, entryNo, statementDiv, contractNum, ogCompanyCode, ogCompanyName, brokerCode, brokerName,
            ctnm, insstdt, insenddt, uy, curcd, paidpercent, paidshare, oslpercent, oslshare, grosspm, pm, pmpfend, pmpfwos, xolpm,
            returnpm, grosscn, cn, profitcn, brokerage, tax, overridingcom, charge, pmreservertd1, pfpmreservertd1, pmreservertd2, pfpmreservertd2,
            claim, lossrecovery, cashloss, cashlossrd, lossrr, lossrr2, losspfend, losspfwoa, interest, taxon, miscellaneous, pmbl,
            cmbl, ntbl, cscosarfrncnnt2
         FROM 
            tbl_batch_answer_data
         where 
            imgId = :imgId `,
    selectContractMapping:
        `SELECT
            extOgcompanyName, extCtnm, asOgcompanyName, asCtnm
         FROM
            tbl_contract_mapping
         WHERE
            extOgcompanyName = :extOgcompanyName AND extCtnm = :extCtnm
        `,
    selectTypo:
        `SELECT
            seqNum, keyword
         FROM
            tbl_ocr_symspell
         WHERE
            1=1 `,
    selectExportSentenceSid:
        `SELECT
            EXPORT_SENTENCE_SID (:word) as word
         FROM
            dual `,
    insertContractMapping:
        `INSERT INTO
            tbl_contract_mapping(extOgcompanyName, extCtnm, asOgcompanyName, asCtnm)
         VALUES(:extOgcompanyName, :extCtnm, :asOgcompanyName, :asCtnm)
        `,
    insertDocCategory:
        `INSERT INTO
            tbl_document_category
         VALUES
            (seq_document_category.nextval, :docName, :docType, :sampleImagePath) `,
    selectMaxDocType:
        `SELECT
            NVL(MAX(DOCTYPE),0) + 1 AS MAXDOCTYPE
         FROM
            TBL_DOCUMENT_CATEGORY `,
    selectBatchAnswerDataToFilePath:
        `SELECT
            D.*
         FROM
            (SELECT
                SUBSTR(filePath, INSTR(filePath, '/', -1) + 1, LENGTH(filePath)) AS filePath,
                imgId
             FROM
                TBL_BATCH_ANSWER_FILE 
            ) F,
            TBL_BATCH_ANSWER_DATA D
        WHERE
            F.imgId = D.imgId
            AND
            F.filePath = :filePath `,
    selectMultiBatchAnswerDataToFilePath:
        `SELECT
            D.*, F.filePath AS fileName
         FROM
            (SELECT
                SUBSTR(filePath, INSTR(filePath, '/', -1) + 1, LENGTH(filePath)) AS filePath,
                imgId
             FROM
                TBL_BATCH_ANSWER_FILE 
            ) F,
            TBL_BATCH_ANSWER_DATA D
        WHERE
            F.imgId = D.imgId
            AND
            F.filePath IN `,
    insertMlExport:
        `INSERT INTO TBL_BATCH_ML_EXPORT(IMGID, FILEPATH, COLLABEL, COLVALUE, LOCATION, SID)
         VALUES(:imgId, :filepath, :colLabel, :colValue, :location, :sid)`,
    deleteMlExport:
        `DELETE FROM TBL_BATCH_ML_EXPORT
         WHERE FILEPATH = :filepath `,
    selectBatchLearnDataList:
        `SELECT
            T.*
        FROM 
          (SELECT
                count(FILENAME) count,
                LISTAGG(A.IMGID,'||') WITHIN GROUP(ORDER BY A.FILENAME) as IMGID,
                LISTAGG(A.STATUS,'||') WITHIN GROUP(ORDER BY A.FILENAME) as STATUS, 
                LISTAGG(nvl(A.ENTRYNO,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as ENTRYNO, 
                LISTAGG(nvl(A.STATEMENTDIV,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as STATEMENTDIV, 
                LISTAGG(nvl(A.CONTRACTNUM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) CONTRACTNUM, 
                LISTAGG(nvl(A.OGCOMPANYCODE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as OGCOMPANYCODE, 
                LISTAGG(nvl(A.OGCOMPANYNAME,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as OGCOMPANYNAME, 
                LISTAGG(nvl(A.BROKERCODE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as BROKERCODE, 
                LISTAGG(nvl(A.BROKERNAME,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as BROKERNAME, 
                LISTAGG(nvl(A.CTNM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CTNM, 
                LISTAGG(nvl(A.INSSTDT,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as INSSTDT, 
                LISTAGG(nvl(A.INSENDDT,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as INSENDDT, 
                LISTAGG(nvl(A.UY,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as UY, 
                LISTAGG(nvl(A.CURCD,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CURCD, 
                LISTAGG(nvl(A.PAIDPERCENT,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PAIDPERCENT, 
                LISTAGG(nvl(A.PAIDSHARE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PAIDSHARE, 
                LISTAGG(nvl(A.OSLPERCENT,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as OSLPERCENT, 
                LISTAGG(nvl(A.OSLSHARE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as OSLSHARE, 
                LISTAGG(nvl(A.GROSSPM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as GROSSPM, 
                LISTAGG(nvl(A.PM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PM, 
                LISTAGG(nvl(A.PMPFEND,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PMPFEND, 
                LISTAGG(nvl(A.PMPFWOS,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PMPFWOS, 
                LISTAGG(nvl(A.XOLPM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as XOLPM, 
                LISTAGG(nvl(A.RETURNPM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as RETURNPM, 
                LISTAGG(nvl(A.GROSSCN,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as GROSSCN, 
                LISTAGG(nvl(A.CN,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CN, 
                LISTAGG(nvl(A.PROFITCN,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PROFITCN, 
                LISTAGG(nvl(A.BROKERAGE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as BROKERAGE, 
                LISTAGG(nvl(A.TAX,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as TAX, 
                LISTAGG(nvl(A.OVERRIDINGCOM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as OVERRIDINGCOM, 
                LISTAGG(nvl(A.CHARGE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CHARGE, 
                LISTAGG(nvl(A.PMRESERVERTD,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PMRESERVERTD, 
                LISTAGG(nvl(A.PFPMRESERVERTD,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PFPMRESERVERTD, 
                LISTAGG(nvl(A.PMRESERVERTD2,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PMRESERVERTD2, 
                LISTAGG(nvl(A.PFPMRESERVERTD2,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PFPMRESERVERTD2, 
                LISTAGG(nvl(A.CLAIM,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CLAIM, 
                LISTAGG(nvl(A.LOSSRECOVERY,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as LOSSRECOVERY, 
                LISTAGG(nvl(A.CASHLOSS,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CASHLOSS, 
                LISTAGG(nvl(A.CASHLOSSRD,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CASHLOSSRD, 
                LISTAGG(nvl(A.LOSSRR,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as LOSSRR, 
                LISTAGG(nvl(A.LOSSRR2,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as LOSSRR2, 
                LISTAGG(nvl(A.LOSSPFEND,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as LOSSPFEND, 
                LISTAGG(nvl(A.LOSSPFWOA,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as LOSSPFWOA, 
                LISTAGG(nvl(A.INTEREST,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as INTEREST, 
                LISTAGG(nvl(A.TAXON,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as TAXON, 
                LISTAGG(nvl(A.MISCELLANEOUS,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as MISCELLANEOUS, 
                LISTAGG(nvl(A.PMBL,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as PMBL, 
                LISTAGG(nvl(A.CMBL,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CMBL, 
                LISTAGG(nvl(A.NTBL,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as NTBL, 
                LISTAGG(nvl(A.CSCOSARFRNCNNT2,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CSCOSARFRNCNNT2, 
                LISTAGG(A.REGDATE,'||') WITHIN GROUP(ORDER BY A.FILENAME) as REGDATE, 
                LISTAGG(nvl(A.SUBNUM,1),'||') WITHIN GROUP(ORDER BY A.FILENAME) as SUBNUM, 
                LISTAGG(nvl(A.CURUNIT,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CURUNIT, 
                LISTAGG(nvl(A.CONVERTEDIMGPATH,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as CONVERTEDIMGPATH, 
                LISTAGG(nvl(A.FILENAME,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as FILENAME, 
                LISTAGG(nvl(A.FILEPATH,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as FILEPATH, 
                LISTAGG(nvl(A.EXPORTTYPE,'null'),'||') WITHIN GROUP(ORDER BY A.FILENAME) as EXPORTTYPE  
        FROM TBL_BATCH_LEARN_DATA A
        WHERE A.STATUS != 'D' AND A.STATUS = :status
        AND FILEPATH IN 
        `,
    selectBatchMLExportList:
        `SELECT
            IMGID, COLLABEL, COLVALUE
         FROM
            TBL_BATCH_ML_EXPORT
         WHERE
            COLLABEL != '36'
            AND
            IMGID IN `,
    selectBatchLearnIdList:
        `SELECT ROWNUM, A.FILEPATH AS FILEPATH
         FROM (
            SELECT *
            FROM TBL_BATCH_LEARN_ID
            WHERE STATUS = :status ) A
         WHERE ROWNUM >= :startNum and ROWNUM <= :endNum 
        `,
    selectBatchLearnMlList:
        `SELECT IMGID, COLLABEL, COLVALUE, LOCATION, SID, FILEPATH 
         FROM TBL_BATCH_ML_EXPORT WHERE FILEPATH IN `,
    insertBatchLearnList:
        `INSERT INTO
            TBL_BATCH_LEARN_LIST
         VALUES
            (:imgId, 'D', :filePath, :docType, sysdate) `,
    selectDocumentCategory:
        `SELECT
            SEQNUM, DOCNAME, DOCTYPE, SAMPLEIMAGEPATH
         FROM
            TBL_DOCUMENT_CATEGORY
         WHERE
            LOWER(DOCNAME) LIKE LOWER(:docName)
         AND DOCTYPE != 0 AND DOCTYPE != 1 `,
    selectDocType:
        `SELECT
            SEQNUM, DOCNAME, DOCTYPE, SAMPLEIMAGEPATH
         FROM
            TBL_DOCUMENT_CATEGORY
         WHERE
            DOCNAME = :docName `,
    deleteAnswerFile: 
        `DELETE FROM TBL_BATCH_ANSWER_FILE WHERE FILEPATH = :filepath`
};

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
            tbl_extraction_keyword `,
    selectLikeDocCategory:
        `SELECT
            seqNum, docName, docType, sampleImagePath
         FROM
            tbl_document_category
         WHERE
            lower(docName) LIKE lower(:docName) AND docType != 999 `,
    selectMaxDocType:
        `SELECT
            MAX(docType) AS docType
         FROM
            tbl_document_category
         WHERE
            docType != 999 `,
    insertDocCategory:
        `INSERT INTO
            tbl_document_category
         VALUES
            (seq_document_category.nextval, :docName, :docType, :sampleImagePath) `,
    selectTypoCorrect:
        `SELECT SEQNUM, USERID, ORIGINWORD, CORRECTEDWORD, REGDATE, CONVERTEDIMAGEFILENAME, CORRECTORTYPE
         FROM TBL_OCR_TYPO_CORRECT
         WHERE 1=1 `,
    insertTypoCorrect:
        `INSERT INTO 
            TBL_OCR_TYPO_CORRECT(seqNum, userId, originWord, correctedWord, convertedImageFileName, correctorType) 
         VALUES
            (seq_ocr_typo_correct.nextval, :userid, :originWord, :correctWord, :fileName, :correctorType) `,
    selectCurcdMapping:
        `SELECT
            beforeText, afterText
         FROM
            tbl_curcd_mapping
         WHERE
            beforeText = :beforeText AND afterText = :afterText
        `,
    selectCurcdMapping2:
        `SELECT
            beforeText, afterText
         FROM
            tbl_curcd_mapping
         WHERE
            beforeText = :beforeText
        `,
    insertCurcdMapping:
        `INSERT INTO 
            tbl_curcd_mapping(beforeText, afterText)
         VALUES
            (:beforeText, :afterText) `,
    insertContractMapping2:
        `INSERT INTO
            tbl_contract_mapping(extOgcompanyName, extCtnm, asOgcompanyName, asCtnm)
         VALUES
            (: extOgcompanyName, : extCtnm, : asOgcompanyName, : asCtnm) `   
};

var commonConfig = {
    insertCommError:
        `INSERT INTO 
            tbl_comm_error
         VALUES
            (seq_comm_error.nextval, :userId, sysdate, :errorType, :errorCode) `,
    insertFileInfo:
        `INSERT INTO
            tbl_ocr_file(seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize, contentType, fileType, regId, regDate)
         VALUES
            (seq_ocr_file.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `,
    insertFileDtlInfo:
        `INSERT INTO
            tbl_ocr_file_dtl(seqNum, imgId, filePath, originFileName, serverFileName, fileExtension, fileSize, contentType, fileType, regId, regDate)
         VALUES
            (seq_ocr_file_dtl.nextval, :imgId, :filePath, :originFileName, :serverFileName, :fileExtension, :fileSize, :contentType, :fileType, :regId, sysdate) `
};

var mlConfig = {
    selectDocCategory:
        `SELECT
            seqNum, docName, docType, sampleImagePath
         FROM
            tbl_document_category
         WHERE
            docType = :docType `,
    insertDocLabelMapping:
        `INSERT INTO
            tbl_form_label_mapping
         VALUES
            (seq_form_label_mapping.nextval, :data, :class, sysdate) `,
    insertDocMapping:
        `INSERT INTO
            tbl_form_mapping
         VALUES
            (seq_form_mapping.nextval, :data, :class, sysdate) `,
    insertColMapping:
        `INSERT INTO
            tbl_column_mapping_train
         VALUES
            (seq_column_mapping_train.nextval, :data, :class, sysdate) `,
    selectContractMapping:
        `SELECT
            extOgcompanyName, extCtnm, asOgcompanyName, asCtnm
         FROM
            tbl_contract_mapping
         WHERE
            extOgcompanyName = :extOgcompanyName AND extCtnm = :extCtnm
        `,
    selectdocCategory:
        `SELECT
            seqNum, docName, docType, sampleImagePath
         FROM
            tbl_document_category
         WHERE
            docType = :docType `,
    selectFormLabelMapping:
        `SELECT
            DATA, CLASS
         FROM
            TBL_FORM_LABEL_MAPPING
         WHERE DATA IN `,
    selectFormMapping:
        `SELECT 
            DATA, CLASS
         FROM
            TBL_FORM_MAPPING
         WHERE DATA = :DATA `,
    selectColumnMapping:
        `SELECT 
            SEQNUM, DATA, CLASS 
         FROM 
            TBL_COLUMN_MAPPING_TRAIN 
         WHERE
            DATA IN (
                    SELECT T.DATA 
                    FROM ( 
                        SELECT 
                            DATA, COUNT(DATA) AS COUNT 
                        FROM 
                            TBL_COLUMN_MAPPING_TRAIN 
                        GROUP BY DATA) T 
                    WHERE T.COUNT = 1
                    ) `,
    selectTypoMapping:
        `SELECT
            ORIGINTEXT, TEXT
         FROM
            TBL_TYPO_MAPPING
         WHERE
            ORIGINTEXT IN `

};

module.exports = {
    count: count,
    sessionConfig: sessionConfig,
    userMngConfig: userMngConfig,
    dbcolumnsConfig: dbcolumnsConfig,
    documentConfig: documentConfig,
    invoiceRegistrationConfig: invoiceRegistrationConfig,
    myApprovalConfig: myApprovalConfig,
    batchLearningConfig: batchLearningConfig,
    uiLearningConfig: uiLearningConfig,
    commonConfig: commonConfig,
    mlConfig: mlConfig
};