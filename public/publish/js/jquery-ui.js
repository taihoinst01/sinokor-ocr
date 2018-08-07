
jQuery(function($){


	// 메뉴용 on/off_효과
		$(".lnb_menu li>a").click(function(){
			$('.lnb_menu li').removeClass('on');
			$(this).parent('li').addClass('on');
		});
	// 양식이미지용 on/off_효과
		$(".box_imgtmb li .box_img").click(function(){
			$('.box_imgtmb li').removeClass('on');
			$(this).parent('li').addClass('on');
		});

    // 양식이미지용 문서 슬라이딩 좌우버튼 
    //좌측버튼
    $('.button_control1').click(function () {
        $('.box_imgtmb li').each(function () {
            var onCheck = $(this).hasClass('on');
            if (onCheck == true) {
                if ($(this).prev().length != 0) {
                    var imgSrc = $(this).prev().find('img')[0].src;
                    $('.imgtmb_b').find('img')[0].src = imgSrc;
                    $(this).removeClass('on');
                    $(this).prev().addClass('on');
                }
                return false;
            }
        });
    });

    //우측버튼
    $(".button_control2").click(function () {
        $('.box_imgtmb li').each(function () {
            var onCheck = $(this).hasClass("on");
            if (onCheck == true) {
                if ($(this).next().length != 0) {
                    var imgSrc = $(this).next().find('img')[0].src;
                    $('.imgtmb_b').find('img')[0].src = imgSrc;
                    $(this).removeClass('on');
                    $(this).next().addClass('on');
                }
                return false;
            }
        });
    });
	// input 선택시 전체선택/해제
	$(".sta00_all").change(function(){
	 	var chk = $(".sta00");
	 	if(this.checked){
		  	chk.prop("checked", true);
		  	chk.parent().addClass('ez-checked');
		  	$(".stck_tr").parents("tr").addClass('on');
	 	}else{
		  	chk.prop("checked", false);
		  	chk.parent().removeClass('ez-checked');
		  	$(".stck_tr").parents("tr").removeClass('on');
	 	}
	});
	$(".stb00_all").change(function(){
	 	var chk = $(".stb00");
	 	if(this.checked){
	  	chk.prop("checked", true);
	  	chk.parent().addClass('ez-checked');
	 	}else{
	  	chk.prop("checked", false);
	  	chk.parent().removeClass('ez-checked');
	 	}
	});

	// input 선택시 해당 tr 색상변환
	$(".stck_tr").change(function(){
		var thiss = $(this);
	 	if(this.checked){
		  	thiss.parents("tr").addClass('on');
	 	}else{
	 		thiss.parents("tr").removeClass('on');
	 	}		
	});




	// UI학습 양식분석상태  - input 클릭시 input 확대/축소
		$(".box_table_st04 dt > .iclick input").click(function(){
			$(this).addClass('on');
		});
		$(".box_table_st04 dt > .iclick input").bind("blur",function(){
			$(this).removeClass('on');
		});

	// 버튼 선택시 class=on 추가제거
	$('.button_st5').click(function(e){
	 	var thiss = $(this);
	 	if(thiss.hasClass('on')){
	  		thiss.removeClass('on');
	 	}else{
	 		thiss.addClass('on');
	 	}
	});


	// TEP 버튼 선택시 시변경
	$('.btn_tep_01').click(function(){
	 	$('.bt_tep > li').removeClass("on");
	 	$(this).parent().addClass('on');
	 	$('.tep_st02, .tep_st03').hide();
	 	$('.tep_st01').show();
	 	$('.subtit_st01 span').text('학습미완료 보기')
	});
	$('.btn_tep_02').click(function(){
	 	$('.bt_tep > li').removeClass("on");
	 	$(this).parent().addClass('on');
	 	$('.tep_st01, .tep_st03').hide();
	 	$('.tep_st02').show();
	 	$('.subtit_st01 span').text('학습완료 보기')
	});
	$('.btn_tep_03').click(function(){
	 	$('.bt_tep > li').removeClass("on");
	 	$(this).parent().addClass('on');
	 	$('.tep_st01, .tep_st02').hide();
	 	$('.tep_st03').show();
	});

	// 학습실행팝업창 학습범위지정 선택시 활성화
	$('#radio-choice-3').on('change',function(){
		if( $(this).is(':checked') ){
			$('.box_day').fadeIn(300);
		} 
	});
	$('#radio-choice-1, #radio-choice-2').on('change',function(){
		if( $(this).is(':checked') ){
			$('.box_day').fadeOut(100);
		} 
	});


	/* select_style 관련 */
	// Common
	var select_root = $('div.select_style');
	var select_value = $('.myValue, .ctrl');
	var select_a = $('div.select_style>ul>li>a');
	var select_input = $('div.select_style>ul>li>input[type=radio]');
	var select_label = $('div.select_style>ul>li>label');
	
	// Radio Default Value
	$('div.myValue').each(function(){
		var default_value = $(this).next('.iList').find('input[checked]').next('label').text();
		$(this).append(default_value);
	});
	
	// Line
	select_value.bind('focusin',function(){$(this).addClass('outLine');});
	select_value.bind('focusout',function(){$(this).removeClass('outLine');});
	select_input.bind('focusin',function(){$(this).parents('div.select_style').children('div.myValue').addClass('outLine');});
	select_input.bind('focusout',function(){$(this).parents('div.select_style').children('div.myValue').removeClass('outLine');});
	
	// Show
	function show_option(){
		$(this).parents('div.select_style:first').toggleClass('open');
	}
	
	// Hover
	function i_hover(){
		$(this).parents('ul:first').children('li').removeClass('hover');
		$(this).parents('li:first').toggleClass('hover');
	}
	
	// Hide
	function hide_option(){
		var t = $(this);
		setTimeout(function(){
			t.parents('div.select_style:first').removeClass('open');
		}, 1);
	}
	
	// Set Input
	function set_label(){
		var v = $(this).next('label').text();
		$(this).parents('ul:first').prev('.myValue').text('').append(v);
		$(this).parents('ul:first').prev('.myValue').addClass('selected');
	}
	
	// Set Anchor
	function set_anchor(){
		var v = $(this).text();
		$(this).parents('ul:first').prev('.myValue').text('').append(v);
		$(this).parents('ul:first').prev('.myValue').addClass('selected');
	}

	// Anchor Focus Out
	$('*:not("div.select_style a")').focus(function(){
		$('.aList').parent('.select_style').removeClass('open');
	});
	
	select_value.click(show_option);
	select_root.removeClass('open');
	select_root.mouseleave(function(){$(this).removeClass('open');});
	select_a.click(set_anchor).click(hide_option).focus(i_hover).hover(i_hover);
	select_input.change(set_label).focus(set_label);
	select_label.hover(i_hover).click(hide_option);
	
	// Form Reset
	$('input[type="reset"], button[type="reset"]').click(function(){
		$(this).parents('form:first').find('.myValue').each(function(){
			var origin = $(this).next('ul:first').find('li:first label').text();
			$(this).text(origin).removeClass('selected');
		});
	});

	 //스크롤 하단시에 위로 열림
	 $('.select_style').click(function(e){
	     var ys_h = e.pageY; 
	     var cont_h1 = $('#wrap').height();
	     var cont_h = cont_h1*0.84;
	     if( cont_h < ys_h ){
	        $("ul.aList").css({"bottom":"40px"}).css({"top":"inherit"});
	     }else{
	        $("ul.aList").css({"bottom":"inherit"});
	     }
	 });


});


/* POPUP */
function layer_open(el){
	var temp = $('#' + el + " .pop_layer");
	var temp1 = $('#' + el);
	var bg = temp1.prev().hasClass('bg');	//dimmed 레이어를 감지하기 위한 boolean 변수
	if(bg){
		$('.poplayer').fadeIn();	//'bg' 클래스가 존재하면 레이어가 나타나고 배경은 dimmed 된다. 
	}else{
		temp1.fadeIn();
	}
	// 화면의 중앙에 레이어를 띄운다.
	if (temp.outerHeight() < $(document).height() ) temp.css('margin-top', '-'+temp.outerHeight()/2+'px');
	else temp.css('top', '0px');
	if (temp.outerWidth() < $(document).width() ) temp.css('margin-left', '-'+temp.outerWidth()/2+'px');
	else temp.css('left', '0px');
	//	temp.find('a.cbtn').click(function(e){
	$('.cbtn').click(function(e){
		$(this).parents('.poplayer').fadeOut();
		e.preventDefault();
	});
	$('.poplayer .bg_click').click(function(e){	//배경을 클릭하면 레이어를 사라지게 하는 이벤트 핸들러
		$('.poplayer').fadeOut();
		e.preventDefault();		
	});

}


/* input label */
$(document).ready(function(){
	$('.box_input input').bind("keydown", function(){
		$(this).parent().find('label').hide();
	});
	$('.box_input input').click(function(){
		$(this).parent().find('label').hide();
	});
	/*$('.box_login').mousemove(function(){
		if($('.input_pw').val().length > 0){
			$('.input_pw').parent().find('label').show();
		}
	});*/
	$('.box_input input').blur(function(){
		if(this.value==""){
			$(this).parent().find('label').show();
		}
	});

});

/* Input Checkbox */
(function($){$.fn.ezMark=function(options){options=options||{};var defaultOpt={checkboxCls:options.checkboxCls||'ez-checkbox',radioCls:options.radioCls||'ez-radio',checkedCls:options.checkedCls||'ez-checked',selectedCls:options.selectedCls||'ez-selected',hideCls:'ez-hide'};return this.each(function(){var $this=$(this);var wrapTag=$this.attr('type')=='checkbox'?'<div class="'+defaultOpt.checkboxCls+'">':'<div class="'+defaultOpt.radioCls+'">';if($this.attr('type')=='checkbox'){$this.addClass(defaultOpt.hideCls).wrap(wrapTag).change(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.checkedCls);}
else{$(this).parent().removeClass(defaultOpt.checkedCls);}});if($this.is(':checked')){$this.parent().addClass(defaultOpt.checkedCls);}}
else if($this.attr('type')=='radio'){$this.addClass(defaultOpt.hideCls).wrap(wrapTag).change(function(){$('input[name="'+$(this).attr('name')+'"]').each(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.selectedCls);}else{$(this).parent().removeClass(defaultOpt.selectedCls);}});});if($this.is(':checked')){$this.parent().addClass(defaultOpt.selectedCls);}}});}})(jQuery);



$(document).ready(function(){
	$('input[type=radio]').ezMark();
	$('input[type=checkbox]').ezMark();
	new $.Zebra_Tooltips($('.tip'));
});




