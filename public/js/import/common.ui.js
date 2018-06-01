var timer = '';
var curr = 0;



//TOP
$(document).ready(function(){

            $(window).scroll(function(){
                if ($(this).scrollTop() > 100) {
                    $('.scrollup').fadeIn();
                } else {
                    $('.scrollup').fadeOut();
                }
            });

            $('.scrollup').click(function(){
                $("html, body").animate({ scrollTop: 0 }, 600);
                return false;
            });

        });




//비동기 폰트 로딩
WebFontConfig = {
    custom: {
        families: ['Nanum Gothic'],
        urls: ['http://fonts.googleapis.com/earlyaccess/nanumgothic.css']
    }
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1.4.10/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();


//모달팝업
$(function(){

var appendthis =  ("<div class='modal-overlay js-modal-close'></div>");

    $('a[data-modal-id],tr.sel[data-modal-id],td.sel[data-modal-id]').click(function(e) {
        e.preventDefault();
    $("body").append(appendthis);
    $(".modal-overlay").fadeTo(500, 0.7);
    //$(".js-modalbox").fadeIn(500);
        var modalBox = $(this).attr('data-modal-id');
        $('#'+modalBox).fadeIn($(this).data());
    });

    $('a.btn_edit[data-modal-id],a.btn_delete[data-modal-id]').click(function(e) {
        e.preventDefault();
    $('#add_entity').remove();

    });


$(".js-modal-close, .modal-overlay").click(function() {
    $(".modal_box, .modal-overlay").fadeOut(500, function() {
        $(".modal-overlay").remove();
         //location.reload();

    });

});



$(window).resize(function() {
    $(".modal_box").css({
        top: ($(window).height() - $(".modal_box").outerHeight()) / 3.5,
        left: ($(window).width() - $(".modal_box").outerWidth()) / 2
    });
});

$(window).resize();

});



//탭메뉴
$(function () {

    $(".tab_content").hide();
    $(".tab_content:first").show();

    $("ul.tabs li").click(function () {
        $("ul.tabs li").removeClass("active").css("color", "#fff");
        //$(this).addClass("active").css({"color": "darkred","font-weight": "bolder"});
        $(this).addClass("active").css("color", "#fff");
        $(".tab_content").hide()
        var activeTab = $(this).attr("rel");
        $("#" + activeTab).fadeIn()
    });
});

//Form

$(document).ready(function() {
    $('.tweak-input').checkRadioTweak();

    $('.aa').click(function() {
        console.log("test");
    });
});

/*
 * 2017-08-29 dyyoo
 * entity, intent 어터런스 없을 경우, filter버튼 안되게 수정
*/
//필터
        $(document).ready(function(){
            $('#filterV').click(function(){
                if($('#entityUtteranceTextTable tbody').find('tr').length != 0){
                    var state = $('.filterop_down').css('display');
                    if(state == 'none'){
                        $('.filterop_down').show();
                    }else{
                        $('#btnSelect').hide(); // 선택x 버튼
                        $('#btnUpdate').hide(); // 변경x 버튼
                        $('#btnError').hide(); // 오류x 버튼

                        $('#btn2Select').show(); // 선택 버튼
                        $('#btn2Update').show(); // 변경 버튼
                        $('#btn2Error').show(); // 오류 버튼

                        $('tbody input[name=ch1]:checkbox').each(function() {
                                $(this).parent().parent().show();
                        });

                        $('.filterop_down').hide();
                    }
                }
            });
        });


//도움말
        $(document).ready(function(){
            $('#helpV').click(function(){
                var state = $('.help_wrap').css('display');
                if(state == 'none'){
                    $('.help_wrap').show();
                }else{
                    $('.help_wrap').hide();
                }
            });
        });

        $(document).ready(function(){
            $('#help_close').click(function(){
                var state = $('.help_wrap').css('display');
                if(state == 'none'){
                    $('.help_wrap').hide();
                }else{
                    $('.help_wrap').hide();
                }
            });
        });


//체크박스

(function ($) {

    //default settings
    var defaults = {
    };

    //final settings
    var settings = {};

    //function methods
    var methods = {
        init: function (options) {

            //extend options
            settings = $.extend({}, defaults, options);

            //wrap under
            if ($(this).length > 0) {
                $(this).each(function(i, e) {
                    var $type = $(e).attr('type');
                    var $checked = !!$(e).prop('checked');
                    var $wrapper = $(document.createElement('div')).addClass('check-radio-tweak-wrapper');

                    //set checked
                    if ($checked) {
                        $wrapper.get(0).setAttribute('checked', '');
                    }

                    $(e).click(function(e) {
                        e.stopPropagation();
                    });

                    //add event listener to wrapper
                    $wrapper.click(function(e) {

                        $('input', this).click();

                        //update checkboxes
                        methods.update();

                        e.stopPropagation();
                        e.preventDefault();
                    });

                    //set type
                    $wrapper.attr('type', $type);

                    //wrap input
                    $(e).wrap($wrapper);
                });
            }
//            $(this).wrap('<div class="check-radio-tweak-wrapper"></div>')

        },
        update: function () {
            $('.check-radio-tweak-wrapper').each(function(i, e) {
                if ($('input', e).prop('checked')) {
                    e.setAttribute('checked', '');
                } else {
                    if ($(e).parents('.Tbl').find('th div[type=checkbox]').attr('checked') == 'checked' && $(e).parent().parent().find('th').length > 0 ) {
                        $(e).removeAttr('checked');
                    }
                }
            });
        }
    };


    /**
     * jQuery plugin
     * @external jQuery.fn
     * @function checkRadioTweak
     * @param {object||string} [methodOrOptions] parameters
     */
    //define function
    $.fn.checkRadioTweak = function (methodOrOptions) {
        //define method called or option
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.flipCounter');
        }
    }


})(jQuery);


//언어선택
/*
 jQuery(document).ready(function ($) {
    $('.language').stbDropdown();
 });
*/




