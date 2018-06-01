/*!
 * jQuery form DatePicker Plugin
 * Copyright (C) 2016 by Taihoinst CO.,LTD. All right reserved.
 * Version: 1.2.0
 */
;(function($, window, document, undefined) {
    "use strict";

    var CARLENDAR_IMAGE_PATH = "/images/common/img_calendar.png";

    /**
     * jquery datepicker
     *
     * $('#sDate').tiDatepicker('eDate');
     */
    $.fn.tiDatepicker = function(targetDate) {
        var $ori = this;

        $ori.datepicker({
            buttonImage: CARLENDAR_IMAGE_PATH,
            buttonImageOnly: true,
            showButtonPanel: true,
            currentText: '오늘',
            closeText: '닫기',
            dateFormat : "yy-mm-dd",
            defaultDate: "0d",
            dayNamesMin: ['일','월', '화', '수', '목', '금', '토'],
            monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
            monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
            onClose: function(dateText) {
                if (targetDate != null && typeof targetDate != "undefined") {
                    $('#'+ targetDate).datepicker('option', '', dateText);
                }
                fn_datePickerStyle();
            },
            changeYear: function(dateText) {
                if (targetDate != null && typeof targetDate != "undefined") {
                    $('#'+ targetDate).datepicker('option', "changeYear", dateText);
                }
                fn_datePickerStyle();
            },
            changeMonth: function(dateText) {
                if (targetDate != null && typeof targetDate != "undefined") {
                    $('#'+ targetDate).datepicker('option', "changeMon", dateText);
                }
                fn_datePickerStyle();
            }
        });
        fn_datePickerStyle();
    };

    /**
     * DatePicker Style Set
     */
    function fn_datePickerStyle() {
        $("img.ui-datepicker-trigger").attr("style", "margin-left:2px; vertical-align:middle; cursor:pointer");
    }

})(jQuery, window, document);