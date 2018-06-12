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

module.exports = queryConfig;