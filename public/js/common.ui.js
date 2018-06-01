var timer = '';
var curr = 0;


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



//달력

  $(function() {
   $('input').filter('.datepicker').datepicker({
    changeMonth: true,
    changeYear: true,
    showOn: 'button',
    buttonImage: 'images/ico_cal.gif',
    buttonImageOnly: true
   });
  });


$(document).ready(function() {

    $( "#fdate" ).datepicker({
         showOn: "button",
         buttonImage: "images/ico_cal.gif",
         buttonImageOnly: true,
         dateFormat : "yy-mm-dd",
         defaultDate: "0d",
         minDate : -100,
         dayNamesMin: ['일','월', '화', '수', '목', '금', '토'],
         monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
         monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
         onClose: function(dateText) {
             $("#tdate").datepicker( "option", "minDate", dateText);
             fn_datePickerStyle();
         },
         changeYear: function(dateText) {
             $("#tdate").datepicker( "option", "changeYear", true);
         },
         changeMonth: function(dateText) {
             $("#tdate").datepicker( "option", "changeMonth", true);
         }
    });

    $( "#tdate" ).datepicker({
        showOn: "button",
        buttonImage: "images/ico_cal.gif",
        buttonImageOnly: true,
        dateFormat : "yy-mm-dd",
        minDate : -100,
        dayNamesMin: ['일','월', '화', '수', '목', '금', '토'],
        monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
        monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
        onClose: function(dateText) {
            $("#fdate").datepicker( "option", "maxDate", dateText);
            fn_datePickerStyle();
        },
        changeYear: function(dateText) {
            $("#fdate").datepicker( "option", "changeYear", true);
        },
        changeMonth: function(dateText) {
            $("#fdate").datepicker( "option", "changeMonth", true);
        }
    });

    fn_datePickerStyle();

    $('#afaxRecv').on('click', function(e) {
        $('#pageIndex').val('1');
        $('#page').val('1');
        e.preventDefault();
        goFaxSendResultList();
    });

    $('#pageSizeUsr').on('keypress', function(e) {
        if (e.keyCode == 13) {
            MovePage(1);
        }
    });

});

function fn_datePickerStyle() {
    $("img.ui-datepicker-trigger").attr("style", "margin-left:2px; vertical-align:middle; cursor:pointer");
}