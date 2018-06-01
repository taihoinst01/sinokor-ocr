// 메뉴별 버튼관련 공통 스크립트
var tcbms = {};
tcbms.authgrp_common = function() {};

var authgrp_common = new tcbms.authgrp_common();

// 코드 바인딩
tcbms.authgrp_common.prototype.bindAuthGrp = function(param) {
    if (param.userId == undefined) return;

    var parameter = {
        authBtnInqYn     : "N"
      , authBtnCrteYn    : "N"
      , authBtnApprYn    : "N"
      , authBtnApprReqYn : "N"
      , authBtnPrtYn     : "N"
      , authBtnExlUpdYn  : "N"
      , authBtnExlDwlYn  : "N"
      , authBtnField1Yn  : "N"
      , authBtnField2Yn  : "N"
      , authBtnField3Yn  : "N"
    };

    // 메뉴별 버튼권한 조회
    $.tiAjax({
          url: "/admin/common/selectMenuAuthInfo.do"
        , async : false
        , data : {
              menuId : param.menuId
            , grpDiv : param.grpDiv
            , programId : param.programId
        }
        , success: function(data) {
            // 화면조회권한이 없으면...
            if (typeof data.ds_authGrp == "undefined" || data.ds_authGrp == null || data.ds_authGrp.length == 0 || data.ds_authGrp.authScrnYn != 'Y') {
                fn_setAuthBtn(parameter);   // 모두 비활성화
            } else {
                fn_setAuthBtn(data.ds_authGrp);
            }
        }
    });
};

(function($) {

    // function 저장 object
    var authIdHash = new Hashtable();

    /**
     * 버튼 권한 제어
     */
    $.fn.setAuthBtn = function (authGubn) {
        if (authGubn == 'N') {
            // onclick에 있는 event function을 빼낸다.
            if ($(this).attr('onclick') != undefined && !authIdHash.containsKey($(this).attr('id'))) {
                authIdHash.put($(this).attr('id'), $(this).attr('onclick'));
            }
            $(this).attr('onclick', '');
            // 조회버튼은 class 별도
            $(this).addClass('btn-warning');
            $(this).addClass('disable');

            if ($('.save').length > 0) {
                $(this).removeClass('save');
            }
            // 엑셀업로드는 별도 처리
            if ($(this).attr('id').indexOf("btn_exl_upd") != -1) {
                $(this).on('click', function(e) {
                    e.preventDefault;
                    return false;
                });
            }
        } else {
            // onclick에 event function을 다시 넣는다.
            if ($(this).attr('id') != undefined && authIdHash.containsKey($(this).attr('id')) && authIdHash.containsKey($(this).attr('id')) != undefined) {
                $(this).attr('onclick', authIdHash.get($(this).attr('id')));
            }
             $(this).removeClass('btn-warning');
             $(this).removeClass('disable');
        }
    };

})(jQuery);

/**
 * 버튼 권한 체크 제어
 */
function fn_setAuthBtn ( btnObj ) {
    // 조회버튼 제어
    $("[id^='btn_inq'").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnInqYn);
    });
    // 저장버튼 제어
    $("[id^='btn_crte_'").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnCrteYn);
    });
    // 승인요청버튼
    $("[id^='btn_apprReqYn']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnApprReqYn);
    });
    // 승인버튼
    $("[id^='btn_apprYn']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnApprYn);
    });
    // 출력버튼
    $("[id^='btn_prt']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnPrtYn);
    });
    // 엑셀업로드
    $("[id^='btn_exl_upd']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnExlUpdYn);
    });
    // 엑셀다운버튼 제어
    $("[id^='btn_exl_dwl']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnExlDwlYn);
    });
    // 기타1
    $("[id^='btn_field_1']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnField1Yn);
    });
    // 기타2
    $("[id^='btn_field_2']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnField2Yn);
    });
    // 기타3
    $("[id^='btn_field_3']").each(function(idx, item) {
        $(this).setAuthBtn(btnObj.authBtnField3Yn);
    });
}