CREATE OR REPLACE FUNCTION export_sentence_sid(input_sentence IN NVARCHAR2)
RETURN NVARCHAR2
IS
return_val NVARCHAR2(1000);
BEGIN
    
    IF(REGEXP_INSTR(input_sentence, '^[+-]?\d*(\.?\d*)$') = 1) THEN
        return_val := '1,1,1,1,1';
    ELSIF(NVL(input_sentence,'N') = 'N') THEN
        return_val := '0,0,0,0,0';
    ELSE
        IF(NVL(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 1),'N') != 'N') THEN
            return_val := TO_CHAR(export_keyword_sid(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 1))) || ',';
        ELSE
            return_val := '0,';
        END IF;
        IF(NVL(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 2),'N') != 'N') THEN
            return_val := return_val || TO_CHAR(export_keyword_sid(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 2))) || ',';
        ELSE
            return_val := return_val || '0,';
        END IF;
        IF(NVL(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 3),'N') != 'N') THEN
            return_val := return_val || TO_CHAR(export_keyword_sid(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 3))) || ',';
        ELSE
            return_val := return_val || '0,';
        END IF;
        IF(NVL(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 4),'N') != 'N') THEN
            return_val := return_val || TO_CHAR(export_keyword_sid(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 4))) || ',';
        ELSE
            return_val := return_val || '0,';
        END IF;
        IF(NVL(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 5),'N') != 'N') THEN
            return_val := return_val || TO_CHAR(export_keyword_sid(REGEXP_SUBSTR(input_sentence, '[^ ]+', 1, 5)));
        ELSE
            return_val := return_val || '0';
        END IF;
    END IF;

    RETURN return_val;

    EXCEPTION
        WHEN OTHERS THEN
               DBMS_OUTPUT.PUT_LINE('check function name : export_sentence_sid');
END;

select export_sentence_sid('valuable ggg ddfasfd sdafsdf sample asdfsd sa') from dual;

CREATE OR REPLACE FUNCTION export_keyword_sid(input_keyword IN NVARCHAR2)
RETURN NUMBER
IS
return_val NUMBER;
BEGIN
    BEGIN
        SELECT seqnum into return_val
        FROM tbl_ocr_symspell
        WHERE keyword = input_keyword;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
        return_val := 0;
    END;
       
    RETURN return_val;

    EXCEPTION
        WHEN OTHERS THEN
               DBMS_OUTPUT.PUT_LINE('check function name : export_keyword_sid');
END;

select export_keyword_sid('valuable') from dual;
