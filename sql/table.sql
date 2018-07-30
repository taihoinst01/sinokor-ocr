-- DB �÷� Ű���� ������ ����
create sequence seq_extraction_keyword start with 1 increment by 1 nocache;

-- DB �÷� Ű���� ���̺� ����
create table TBL_EXTRACTION_KEYWORD(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  koKeyWord VARCHAR2(100) NOT NULL,
  enKeyWord VARCHAR2(100) NOT NULL,
  label VARCHAR2(30) NOT NULL
);

-- �ܾ� ������ ������ ����
create sequence seq_ocr_symspell start with 1 increment by 1 nocache;

-- �ܾ� ������ ���̺� ����
CREATE TABLE TBL_OCR_SYMSPELL(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  keyword VARCHAR2(500),
  frequency NUMBER
);

CREATE SEQUENCE SEQ_OCR_TYPO_CORRECT
START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE TBL_OCR_TYPO_CORRECT(
	seqNum NUMBER PRIMARY KEY,
    userId VARCHAR2(100),
    originWord VARCHAR2(100),
    correctedWord VARCHAR2(100),
    regDate DATE DEFAULT SYSDATE,
    convertedImageFileName VARCHAR2(100),
    correctorType VARCHAR2(1)
);

COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.seqNum IS '������';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.userId IS '�������̵�';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.originWord IS '������ �ܾ�';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.correctedWord IS '������ �ܾ�';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.regDate IS '�����';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.convertedImageFileName IS 'MS OCR SERVICE�� ��û�� ���ϸ�';
COMMENT ON COLUMN TBL_OCR_TYPO_CORRECT.correctorType IS '������ Ÿ��(M:�ӽŷ���, U:�����)';

-- label mapping �з� ������ ����
create sequence seq_label_mapping_cls start with 1 increment by 1 nocache;

-- label mapping �з� ���̺� ����
create table TBL_LABEL_MAPPING_CLS(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  class VARCHAR2(500),
  regdate DATE DEFAULT SYSDATE
);

-- label mapping �н� ������ ����
create sequence seq_label_mapping_train start with 1 increment by 1 nocache;

-- label mapping �н� ���̺� ����
create table TBL_LABEL_MAPPING_TRAIN(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  text VARCHAR2(500),
  class VARCHAR2(500),
  regdate DATE DEFAULT SYSDATE
);

-- text classification �з� ������ ����
create sequence seq_text_classification_cls start with 1 increment by 1 nocache;

-- text classification �з� ���̺� ����
create table TBL_TEXT_CLASSIFICATION_CLS(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  class VARCHAR2(500),
  regdate DATE DEFAULT SYSDATE
);

-- text classification �н� ������ ����
create sequence seq_text_classification_train start with 1 increment by 1 nocache;

-- text classification �н� ���̺� ����
create table TBL_TEXT_CLASSIFICATION_TRAIN(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  text VARCHAR2(500),
  class VARCHAR2(500),
  regdate DATE DEFAULT SYSDATE
);

-- ����� ������ ����
create sequence seq_ocr_comm_user start with 1 increment by 1 nocache;

-- ����� ���̺� ����
create table TBL_OCR_COMM_USER(
  seqNum NUMBER NOT NULL PRIMARY KEY,
  userId VARCHAR2(30) NOT NULL,
  userPw VARCHAR2(100) ,
  auth VARCHAR2(20) ,
  email VARCHAR2(100) ,
  joinDate DATE ,
  lastLoginDate TIMESTAMP ,
  ocrUseCount VARCHAR2(20)
);

-- ��ġ�н� ������ ������ ����
create sequence seq__batch_learn_data start with 1 increment by 1 nocache;

create table TBL_BATCH_LEARN_DATA (
 imgId varchar2(50) NOT NULL,
 status varchar2(1) DEFAULT NULL,
 imgFileStartNo NUMBER DEFAULT NULL,
 imgFileEndNo NUMBER DEFAULT NULL,
 csconm varchar2(200) DEFAULT NULL,
 ctnm varchar2(200) DEFAULT NULL,
 insstdt varchar2(200) DEFAULT NULL,
 insenddt varchar2(200) DEFAULT NULL,
 curcd varchar2(100) DEFAULT NULL,
 pre number DEFAULT NULL ,
 com number DEFAULT NULL ,
 brkg number DEFAULT NULL ,
 txam number DEFAULT NULL ,
 prrscf number DEFAULT NULL,
 prrsrls number DEFAULT NULL ,
 lsrescf number DEFAULT NULL ,
 lsresrls number DEFAULT NULL,
 cla number DEFAULT NULL,
 exex number DEFAULT NULL,
 svf number DEFAULT NULL,
 cas number DEFAULT NULL,
 ntbl number DEFAULT NULL ,
 cscosarfrncnnt2 varchar2(200) DEFAULT NULL,
 regId varchar2(100) DEFAULT NULL,
 regDate timestamp DEFAULT NULL
);

-- ������ ��ųʸ� ���� ������ ����
create sequence seq_ocr_domain_dic_trans start with 1 increment by 1 nocache;

-- ������ ��ųʸ� ���� ���̺� ����
create tableTBL_OCR_DOMAIN_DIC_TRANS(
 seqNum NUMBER NOT NULL PRIMARY KEY,
 frontWord VARCHAR2(50),
 originWord VARCHAR2(50),
 correctedWords VARCHAR2(100),
 rearWord VARCHAR2(50)
);

CREATE SEQUENCE SEQ_OCR_DOMAIN_TRANS
START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE TBL_OCR_DOMAIN_TRANS(
	seqNum NUMBER PRIMARY KEY,
    userId VARCHAR2(100),
    originSentence VARCHAR2(500),
    correctedSentence VARCHAR2(500),
    regDate DATE DEFAULT SYSDATE,
    convertedImageFileName VARCHAR2(100),
    correctorType VARCHAR2(1)
);

COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.seqNum IS '������';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.userId IS '�������̵�';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.originSentence IS '������ �ܾ�';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.correctedSentence IS '������ �ܾ�';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.regDate IS '�����';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.convertedImageFileName IS 'MS OCR SERVICE�� ��û�� ���ϸ�';
COMMENT ON COLUMN TBL_OCR_DOMAIN_TRANS.correctorType IS '������ Ÿ��(M:�ӽŷ���, U:�����)';

-- ocr ���� ������ ����
create sequence seq_ocr_file start with 1 increment by 1 nocache;

-- ocr ���� ���̺� ����
create table TBL_OCR_FILE(
 seqNum NUMBER NOT NULL PRIMARY KEY,
 imgId VARCHAR2(50) NOT NULL,
 filePath VARCHAR2(255) NOT NULL,
 originFileName VARCHAR2(255) NOT NULL,
 serverFileName VARCHAR2(255) NOT NULL,
 fileExtension VARCHAR2(255) NOT NULL,
 fileSize NUMBER NOT NULL,
 contentType VARCHAR2(100),
 fileType VARCHAR2(10),
 fileWidth NUMBER,
 fileHeight NUMBER,
 regId VARCHAR2(100),
 regDate TIMESTAMP
);

-- OCR RESPONSE
CREATE SEQUENCE SEQ_OCR_SERVICE_RESPONSE
START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE TBL_OCR_SERVICE_RESPONSE (
  seqNum NUMBER PRIMARY KEY,
  userId VARCHAR2(100),
  uploadFileName VARCHAR2(100),
  convertedImageFileStart VARCHAR2(100),
  convertedImageFileEnd VARCHAR2(100),
  requestType VARCHAR2(1),
  regDate DATE DEFAULT SYSDATE,
  responseJson VARCHAR2(4000)
);

COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.seqNum IS '������';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.userId IS '�������̵�';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.uploadFileName IS '���ε� ���ϸ�';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.convertedImageFileStart IS '��ȯ���ϸ�';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.convertedImageFileEnd IS '��ȯ������ ������ ���ϸ�';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.requestType IS '��û Ÿ��(L:�н���,R:��� ��Ͽ�)';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.regDate IS '�����';
COMMENT ON COLUMN TBL_OCR_SERVICE_RESPONSE.responseJson IS 'ms ocr json';

-- ��ġ�н� ���� ������ ������ ����
create sequence seq_batch_answer_data start with 1 increment by 1 nocache;

-- ��ġ�н� ���� ������ ���̺� ����
create table TBL_BATCH_ANSWER_DATA(
imgId NUMBER NOT NULL,
imgFileStartNo NUMBER,
imgFileEndNo NUMBER,
entryNo VARCHAR2(100),
statementDiv VARCHAR2(30),
contractNum VARCHAR2(100),
ogCompanyCode VARCHAR2(30),
ogCompanyName VARCHAR2(300),
brokerCode VARCHAR2(30),
brokerName VARCHAR2(300),
ctnm VARCHAR2(300),
insstdt VARCHAR2(100),
insenddt VARCHAR2(100),
uy VARCHAR2(30),
curcd VARCHAR2(30),
paidPercent NUMBER,
paidShare NUMBER,
oslPercent NUMBER,
oslShare NUMBER,
grosspm NUMBER,
pm NUMBER,
pmPFEnd NUMBER,
pmPFWos NUMBER,
xolPm NUMBER,
returnPm NUMBER,
grosscn NUMBER,
cn NUMBER,
profitcn NUMBER,
brokerAge NUMBER,
tax NUMBER,
overridingCom NUMBER,
charge NUMBER,
pmReserveRTD1 NUMBER,
pfPmReserveRTD1 NUMBER,
pmReserveRTD2 NUMBER,
pfPmReserveRTD2 NUMBER,
claim NUMBER,
lossRecovery NUMBER,
cashLoss NUMBER,
cashLossRD NUMBER,
lossRR NUMBER,
lossRR2 NUMBER,
lossPFEnd NUMBER,
lossPFWoa NUMBER,
interest NUMBER,
taxOn NUMBER,
miscellaneous NUMBER,
pmbl NUMBER,
cmbl NUMBER,
ntbl NUMBER,
cscosarfrncnnt2 VARCHAR2(500)
);

CREATE SEQUENCE SEQ_COMM_ERROR
START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE TABLE TBL_COMM_ERROR(
	seqNum NUMBER PRIMARY KEY,
    userId VARCHAR2(100),
    regDate DATE DEFAULT SYSDATE,
    errorType NUMBER,
    errorCode NUMBER
);

COMMENT ON COLUMN TBL_COMM_ERROR.seqNum IS '������';
COMMENT ON COLUMN TBL_COMM_ERROR.userId IS '�������̵�';
COMMENT ON COLUMN TBL_COMM_ERROR.regDate IS '�����';
COMMENT ON COLUMN TBL_COMM_ERROR.errorType IS '1001:OCR REQ����, 1002: typo correct����, 1003:domain dic trans ����';
COMMENT ON COLUMN TBL_COMM_ERROR.errorCode IS '400:InvalidImageUrl,InvalidImageFormat,InvalidImageSize,NotSupportedLanguage';


