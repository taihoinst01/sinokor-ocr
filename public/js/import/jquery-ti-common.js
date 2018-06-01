/*!
 * jQuery common Plugin
 * Copyright (C) 2016 by Taihoinst CO.,LTD. All right reserved.
 * Version: 1.2.0
 */
;(function($, window, document, undefined) {
    "use strict";

    var INJECTION_FILTER = ";--§;=§select §select§insert §insert§update §update§delete §delete§drop §drop§alter §alter§create §create§insert into§create table§drop table§bulk insert§inner join§from §where §union §union§group by§having §having§table §table§shutdown§kill §kill§declare§declare §declare @§%declare§d%eclare§de%clare§dec%lare§decl%are§decla%re§declar%e§declare%§openrowset§opendatasource§pwdencrypt§msdasql§sqloledb§char(§char(94)§char(124)§char(4000)§varchar(4000)§varchar(§var%char(§nchar§cast(§ca%st(§fetch§fetch next§allocate§syslogins§sysxlogins§sysdatabases§sysobjects§syscomments§syscolumns§raiserror§exec §exec§e%xec §=!(§= !(§in (§xp_§sp_§xp_cmdshell§cmdshell§xp_reg§xp_servicecontrol§xp_setsqlsecurity§xp_readerrorlog§xp_controlqueueservice§xp_createprivatequeue§xp_decodequeuecommand§xp_deleteprivatequeue§xp_deletequeue§xp_displayqueuemesgs§xp_dsinfo§xp_merge!lineages§xp_readpkfromqueue§xp_readpkfromvarbin§xp_repl_encrypt§xp_resetqueue§xp_sqlinventory§xp_unpackcab§xp_sprintf§xp_displayparamstmt§xp_enumresult§xp_showcolv§xp_updatecolvbm§xp_execresultset§xp_printstatements§xp_peekqueue§xp_proxiedmetadata§xp_displayparamstmt§xp_availablemedia§xp_enumdsn§xp_filelist§XP_DIRTREE§xp_startmail§xp_sendmail§sp_password§sp_adduser§sp_addextendedproc§sp_dropextendedproc§sp_add_job§sp_start_job§sp_delete_alert§sp_msrepl_startup§subdirectory§trim§cursor§convert§xtype§dirtree§addextendedproc§systypes§sysservers§net user§netuser§net localgroup§netlocalgroup§administrators§master..§srvrolemember§is_member§db_name§db_owner§truncate §%20%20§%20and§%20@S%20§%20Buser%2B§%20SET%20@S§%20SET%20§%20user§%2527§%20%20§%2E%63%6E§%Buser%2B§SET @§S%ET @§+and§and+";
    var injectionCheck = INJECTION_FILTER.split("§");

    $.extend({

        ti: {

            /**
             * dimmed 설정
             */
            dimmedInit: function() {
                var inCss = "";
                inCss += "\n <style type='text/css'>";
                inCss += "\n     .layer {display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999;}";
                inCss += "\n     .layer .bg {position:absolute; top:0; left:0; width:100%; height:100%; background:#000; opacity:.5; filter:alpha(opacity=50); background-color:#fff;}";
                inCss += "\n     .layer .pop-layer {display:block;}";
                inCss += "\n     .pop-layer {display:none; position: absolute; top: 50%; left: 50%; width:32px; height:32px; background-color:#fff; border: 0; z-index: 10;}";
                inCss += "\n </style>";

                var inHtml = "";
                inHtml += '\n <div class="layer">';
                inHtml += '\n     <div class="bg"></div>';
                inHtml += '\n     <div id="layerImg" class="pop-layer" style="background:url(/images/common/ajax-loader1.gif);" />';
                inHtml += '\n </div>';

                $('body').append('<div id="layerPopup"></div>');
                $('#layerPopup').html(inCss + inHtml);
            },

            /**
             * ajax요청 dimmed 처리
             */
            dimmBlock : function () {
                $('.layer').fadeIn(150);
            },

            /**
             * ajax요청 dimmed 처리 해제
             */
            dimmUnBlock : function () {
                $('.layer').fadeOut(150);
            },

            /**
             * ajax요청 및 종료 시 로딩 Display
             */
            preloading : function (bln) {
                if (typeof bln == "undefined" || bln == null || Boolean(bln)) {
                    if (parent && parent != this) {
                        // 부모가 있으면 부모창 전체에 적용
                        window.parent.$.ti.dimmBlock();
                    } else {
                        $.ti.dimmBlock();
                    }
                } else {
                    if (parent && parent != this) {
                        window.parent.top.$.ti.dimmUnBlock();
                    } else {
                        $.ti.dimmUnBlock();
                    }
                }
            },

            /**
             * 빈 값 체크
             */
            isEmptyVal : function(o) {
                if (typeof o == "undefined" || $.trim(o) == "") return true;
                else if ( typeof o == "object" && o == {}) return true;
                else return false;
            },

            /**
             * undefined 체크 공백 리턴
             */
            checkNULL : function(o) {
                if (typeof o == "undefined" || $.trim(o) == "" || o == null || o == "undefined") return "";
                else return o;
            },

            /**
             * 파일 다운로드 시 동적 Form을 생성 Post방식으로 전송
             */
            submitDynamicForm : function(formId, action, method, params, targetId, isSelf) {
                var form = $('form[id=' + formId + ']');
                if (form.length == 0) {
                    form = $(document.createElement('form'))
                        .attr('id',formId)
                        .attr('name',formId)
                        .attr('action', action)
                        .attr('method', method);
                    if (targetId != null && typeof targetId != "undefined") {
                        form.attr('target', targetId);
                    }
                    $('body').append(form);
                }
                form.empty();

                // 파라미터 Object로 Form에 hidden필드를 생성
                if ($.isArray(params)) {
                    // Object{name='',value=''}
                    $.each(params, function() {
                        var valstr = this.value;
                        //console.log(" 1 ==> " + valstr);
                        if ($.isArray(valstr) || $.isPlainObject(valstr)) {
                            valstr = JSON.stringify(valstr);
                        }
                        form.append('<input type="hidden" name=\''+this.name+'\' value=\''+valstr+'\' />');
                    });
                } else {
                    // Object{key:value}
                    for (var name in params) {
                        var valstr = params[name];
                        //console.log(name + " 2 ==> " + valstr);210
                        if ($.isArray(valstr) || $.isPlainObject(valstr)) {
                            valstr = JSON.stringify(valstr);
                        }
                        form.append('<input type="hidden" name=\''+name+'\' value=\''+valstr+'\' />');
                    }
                }

                // Form Submit
                if (parent) {
                    if (!isSelf || typeof isSelf == "undefined" || isSelf == null) {
                        form.attr('target', '_parent');
                    }
                    form.submit();
                } else {
                    form.submit();
                }

                // dinymin form remove
                form.remove();
            },

            /**
             * 날짜형식 변환
             */
            fn_DateFormatConvert : function(tdate, strformat) {
                try {
                    var rString = '';
                    var y = tdate.substring(0,4);
                    var m = tdate.substring(4,6);
                    var d = tdate.substring(6,8);

                    if (Number(m) < 10)
                        m = "0" + Number(m);
                    if (Number(d) < 10)
                        d = "0" + Number(d);

                    var gubunChar = '';

                    if (strformat.length == 8) { // //yyyymmdd
                        if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                            rString = y + m + d;
                        } else if (strformat.substring(1, 2).toUpperCase() == 'M') {
                            rString = m + d + y;
                        } else if (strformat.substring(1, 2).toUpperCase() == 'D') {
                            rString = d + m + y;
                        }
                    } else if (strformat.length == 7) { // //yyyy?mm
                        if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                            gubunChar = strformat.substring(4, 5);
                        } else {
                            gubunChar = strformat.substring(2, 3);
                        }
                        rString = y + gubunChar + m; // 년월 표시는 yyyy?mm 형식 고정
                    } else if (strformat.length == 6) { // //yyyymm
                        rString = y + m; // 년월 표시는 yyyy?mm 형식 고정
                    } else if (strformat.length == 4) { // //yyyy
                        rString = y;
                    } else if (strformat.length == 10) { // //yyyy?mm?dd
                        if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                            gubunChar = strformat.substring(4, 5);
                            rString = y + gubunChar + m + gubunChar + d;
                        } else if (strformat.substring(1, 2).toUpperCase() == 'M') {
                            gubunChar = strformat.substring(2, 3);
                            rString = m + gubunChar + d + gubunChar + y;
                        } else if (strformat.substring(1, 2).toUpperCase() == 'D') {
                            gubunChar = strformat.substring(2, 3);
                            rString = d + gubunChar + m + gubunChar + y;
                        }
                    }
                    return rString;
                } catch (e) {
                    return "";
                }
            },

            /**
             * 간단 html tag 변환
             */
            fn_chgConvertion : function(strVal) {
                var retVal = strVal.toString().replace(/>/g, '>').replace(/&/g, '&').replace(/"/g, '"').replace(/'/g, '\'').replace(/</g, '<');
                return retVal;
            },

            /**
             * Xss문자 변환
             */
            fn_chgXssConvertion : function(strVal) {
                var retVal = strVal.toString().replace(/[(]/g, '&#40;').replace(/[)]/g, '&#41;').replace(/[#]/g, '&#35;').replace(/[>]/g, '>').replace(/["]/g, '"').replace(/[']/g, "'").replace(/[<]/g, '<');
                return retVal;
            },

            /** 페이징 처리
             *
             * $.ti.fn_getPageLink(
             *         data.paginationInfo.recordCountPerPage,
             *         data.paginationInfo.currentPageNo,
             *         data.paginationInfo.totalPageCount,
             *         "/images/community",
             *         "#paginationInfo"
             *         );
             */
            fn_getPageLink : function(lnum, p, tpage, imgpath, trPage) {
                $(trPage).html("");

                //var g_p1 = "<img src='"+imgpath+"/arrow_left.gif' border='0' align='absmiddle' /></a>&#160;";
                //var g_p2 = "<img src='"+imgpath+"/arrow_left.gif' border='0' align='absmiddle' /></a>&#160;";
                //var g_n1 = "&#160;<img src='"+imgpath+"/arrow_right.gif' border='0' align='absmiddle' />";
                //var g_n2 = "&#160;<img src='"+imgpath+"/arrow_right.gif' border='0' align='absmiddle' />";
                var g_cn = "   ";
                var g_q  = "<a class='bbs_pre' href='javascript:MovePage(1);'><span><strong> << </strong><span class='hc'>처음</span></span></a> ";

                if (p < lnum+1) { g_q += "<a class='bbs_pre2' href='javascript:MovePage(1);'><span><strong> < </strong><span class='hc'>이전</span></span></a>"; }
                else { var pp = parseInt((p-1)/lnum)*lnum; g_q += "<a class='bbs_pre2' href='javascript:MovePage("+pp+");'><span><strong> < </strong><span class='hc'>이전</span></span></a>";} g_q += g_cn;

                var st1 = parseInt((p-1)/lnum)*lnum + 1;
                var st2 = st1 + lnum;

                for (var jn = st1; jn < st2; jn++)
                    if ( jn <= tpage)
                        (jn == p)? g_q += "<a href='#' class='on'><span>"+jn+"</span></a>"+g_cn : g_q += "<a href='javascript:MovePage("+jn+");'><span>"+jn+"</span></a>"+g_cn;

                if (tpage < lnum || tpage < jn) { g_q += "<a class='bbs_next' href='javascript:MovePage("+tpage+");'><strong> > </strong><span class='hc'>다음</span></a>"; }
                else { var np = jn; g_q += "<a class='bbs_next' href='javascript:MovePage("+np+");'><strong> > </strong><span class='hc'>다음</span></a>"; }
                g_q += " <a class='bbs_next2' href='javascript:MovePage("+tpage+");'><strong> >> </strong><span class='hc'>끝</span></a>";

                $(trPage).append(g_q);
            },

            /**
             * jsonData를 formId에 매핑시켜 하위 요소들에 값들을 세팅한다.
             *
             * ex) $.ti.jsonToForm(data.menuMap, '#mainBody');
             */
            jsonToForm : function(objData, formId) {
                // Form에 값 세팅
                for (var key in objData) {
                    var checkBoxVal = new Array();
                    $(formId+" :input[type != button]").each(function(i, obj) {
                        if ($(this).attr("type") == "checkbox" && $(this).attr("name") == key) {
                            if ($.trim(objData[key]) != '') {
                                checkBoxVal = objData[key].split(',');
                            }
                        }
                    });
                    if ($('input[name='+key+']').attr('type') === null ||
                        $('input[name='+key+']').attr('type') === "undefined" ||
                        typeof $('input[name='+key+']').attr('type') === "undefined") {
                        try {
                            if ($('#'+key).get(0).nodeName === "select" || $('#'+key).get(0).nodeName === "SELECT") {
                                $('#'+key).val(objData[key]).attr("selected","selected");
                            } else {
                                $('#'+key).val(objData[key]); // textarea
                            }
                        } catch(e) {
                        }
                    } else if ($('input[name='+key+']').attr('type') == 'radio') {
                        $('input:radio[name='+key+']:input[value='+objData[key]+']').attr("checked", true);
                    } else if ($('input[name='+key+']').attr('type') == 'checkbox') {
                        for (var i = 0, len = checkBoxVal.length; i < len; i++) {
                            $('input:checkbox[name='+key+']:input[value='+checkBoxVal[i]+']').attr("checked", true);
                        }
                    } else {
                        $('input[name='+key+']').val(objData[key]);
                    }
                };

                // div, span에 값 세팅
                $(formId + ' div, span').each(function(idx, item) {
                    var itemId = $(item).attr("id");
                    if (itemId != null && typeof itemId != "undefined") {
                        var result = eval("objData."+itemId);
                        if (result != null && typeof result != "undefined") {
                            $('#'+itemId).html($.ti.fn_chgConvertion(result));
                        }
                    }
                });

                $.tinit.objInit();
            },

            /**
             * formId 하위 요소들중 특정 element의 값을 세팅한다.
             *
             * ex) $.ti.formElementSetValue('#mainBody', elements);
             */
            formElementSetValue : function(formId, elements) {
                $(formId + " :input[type != button]").each(function(i, obj) {
                    var objId =$(this).attr('id');
                    $.each(elements, function(key, value) {
                        if (objId == key) {
                            $('#'+objId).val(value);
                        }
                    });
                });
            }

        }

    });

    /**
     * form의 데이터를 json 형태로 변환해 준다.
     * return : 성공시에는 객체(JSON)을 리턴한다.
     *          실패시에는 null을 리턴한다.
     */
    $.fn.serializeObject = function() {
        var obj = null;
        try {
            if (this[0].tagName && this[0].tagName.toUpperCase() == "FORM") {
                var arr = this.serializeArray();
                if (arr) {
                    obj = {};
                    $.each(arr, function() {
                        obj[this.name] = this.value;
                    });
                }// if ( arr ) {
            }
        } catch (e) {
            alert(e.message);
        } finally {
        }

        return obj;
    };

    /**
     * input의 등재된 Field 길이 체크
     */
    $.fn.checkTlength = function() {
        var retVal = true;
        var msgLen = 0;
        var maxLen = 0;
        var fname = "";
        var fmsg = "";
        var str = "";

        var tmpId = "";
        if (typeof this[0] != "undefined" && this[0] != null && this[0].id.length > 0) {
            tmpId = "#"+this[0].id;
        } else {
            tmpId = "body";
        }

        try {
            $(tmpId + " :input[type != button]").each(function(i, obj) {
                // 비밀번호에서는 특수문자를 사용하기 때문에 비밀번호 제외
                if ($(this).attr("type") != "hidden" &&
                    $(this).attr("type") != "file" &&
                    $(this).attr("readonly") != "readonly" &&
                    $(this).attr("type") != "password" &&
                    $(this).prop("tagName").toUpperCase() != "SELECT" &&
                    $(this).attr("type") != "checkbox" &&
                    $(this).attr("type") != "radio") {
                    if (typeof ($(this).attr("tmaxlength")) != "undefined") {
                        str = $(this).val();
                        if (str != null && typeof str != "undefined") {
                          msgLen = fn_msgByte($(this).val());
                          maxLen = $(this).attr("tmaxlength");

                          if ( msgLen > maxLen ) {
                              fname = ((typeof $(this).attr("ftitle") == "undefined") ? $(this).attr("alt") : $(this).attr("ftitle"));
                              fmsg = ((fname=='' || typeof fname == 'undefined') ? '' : fname + ' 란은 ');
                              alert(fmsg + maxLen + 'byte 이내로 입력하세요.\n한글은 2byte, 영문/숫자는 1byte 인식됩니다.');
                              $(this).val('');
                              $(this).focus();
                              retVal = false;
                              return eval(retVal);
                          }
                       }
                    }
                }
            });
        } catch (e) {
        } finally {
        }

        return eval(retVal);
    };

    /**
     * Form 특수문자 및 사용금지어 체크
     */
    $.fn.checkSpecialCharacter = function() {
        var str = "";
        var retVal = true;
        var fname = "";
        var fmsg = "";

        var tmpId = "";
        if (typeof this[0] != "undefined" && this[0] != null && this[0].id.length > 0) {
            tmpId = "#"+this[0].id;
        } else {
            tmpId = "body";
        }

        try {
            var specialChar = ["'",'"',"=","+",";","*","^","%","$","/","`","~",":","<",">","&","#"];
            $(tmpId + " :input[type != button]").each(function(i, obj) {
                // 비밀번호에서는 특수문자를 사용하기 때문에 비밀번호 제외
                if ($(this).attr("sendCOMP") != "Y" &&
                    $(this).attr("type") != "hidden" &&
                    $(this).attr("type") != "file" &&
                    $(this).attr("readonly") != "readonly" &&
                    $(this).attr("type") != "password" &&
                    $(this).prop("tagName").toUpperCase() != "SELECT" &&
                    $(this).attr("type") != "checkbox" &&
                    $(this).attr("type") != "radio") {
                    str = $(this).val();
                    if (str != null && typeof str != "undefined") {
                        for (var i = 0; i <= (str.length); i++) {
                            var cha = str.substring(i, i + 1);
                            for (var j = 0; j < specialChar.length; j++) {
                                if (cha == specialChar[j]) {
                                    retVal = false;
                                    break;
                                }
                            }
                        }
                        if (!retVal) {
                            fname = ((typeof $(this).attr("ftitle") == "undefined") ? $(this).attr("alt") : $(this).attr("ftitle"));
                            fmsg = ((fname=='' || typeof fname == 'undefined') ? '' : fname + ' 란은 ');
                            alert(fmsg + "특수문자를 허용하지 않습니다.\n\n다시 입력하여 주십시오!");
                            $(this).val('');
                            $(this).focus();
                            return eval(retVal);
                        }
                    }
                }
            });

            // 사용금지어 체크
            if (retVal) {
                // sqlInjection 체크
                var tmpInjection = "";
                $(tmpId + " :input[type != button]").each(function(i, obj) {
                    // 비밀번호에서는 특수문자를 사용하기 때문에 비밀번호 제외
                    if ($(this).attr("sendINJ") != "Y" &&
                        //$(this).attr("sendCOMP") != "Y" &&
                        $(this).attr("type") != "hidden" &&
                        $(this).attr("type") != "file" &&
                        $(this).attr("readonly") != "readonly" &&
                        $(this).attr("type") != "password" &&
                        $(this).prop("tagName").toUpperCase() != "SELECT" &&
                        $(this).attr("type") != "checkbox" &&
                        $(this).attr("type") != "radio") {
                        str = $(this).val();
                        tmpInjection = "";
                        if (str != null && typeof str != "undefined") {
                            for (var i = 0; i <= (str.length); i++) {
                                for (var j = 0; j < injectionCheck.length; j++) {
                                    if (str.indexOf(injectionCheck[j]) > -1) {
                                      tmpInjection = injectionCheck[j];
                                      retVal = false;
                                      break;
                                    }
                                }
                            }
                            if (!retVal) {
                                fname = ((typeof $(this).attr("title") == "undefined") ? $(this).attr("alt") : $(this).attr("title"));
                                fmsg = ((fname=='' || typeof fname == 'undefined') ? '' : fname + ' 란은 ');
                                alert(fmsg + "사용금지어를 허용하지 않습니다.\n\n다시 입력하여 주십시오! [" + tmpInjection + "]");
                                $(this).val('');
                                $(this).focus();
                                return eval(retVal);
                            }
                        }
                    }
                });
            }
        } catch (e) {
        } finally {
        }

        return eval(retVal);
    };

})(jQuery, window, document);