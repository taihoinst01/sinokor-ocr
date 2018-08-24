alter table TBL_BATCH_ANSWER_FILE rename column C_IMGID to IMGID;
alter table TBL_BATCH_ANSWER_FILE modify (IMGID varchar2(80));
alter table TBL_BATCH_ANSWER_FILE rename column C_PAGENUM to PAGENUM;
alter table TBL_BATCH_ANSWER_FILE modify (PAGENUM varchar2(80));
alter table TBL_BATCH_ANSWER_FILE rename column C_FILEPATH to FILEPATH;
alter table TBL_BATCH_ANSWER_FILE modify (FILEPATH varchar2(80));
alter table TBL_BATCH_ANSWER_FILE rename column C_TOTALCOUNT to TOTALCOUNT;
alter table TBL_BATCH_ANSWER_FILE modify (TOTALCOUNT varchar2(80));