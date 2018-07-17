
jQuery(function($){

	// LNB_좌우이동_효과 
		$('.btn_reduction').click(function(){
			$('.lnb_menu').animate({'width':'50px'},250);
			$('#content').animate({'margin-left':'49px'},250);
			$(this).hide();
			$('.btn_expansion').show();
			$('.lnb_menu').addClass('on');
			$('.lnb_menu h3 span, .lnb_menu li a span').fadeOut(100);	

		});
		$('.btn_expansion').click(function(){
			$('.lnb_menu').animate({'width':'185px'},250);
			$('#content').animate({'margin-left':'185px'},250);
			$(this).hide();
			$('.btn_reduction').show();
			$('.lnb_menu').removeClass('on');			
			$('.lnb_menu h3 span, .lnb_menu li a span').delay(200).fadeIn(100);	

		});


	// INPUT 글자입력시에 삭제버튼생성
	var $ipt = $('.box_inpw_in input'), 
		$clearIpt = $('.sch_del');
		$ipt.keyup(function(){
			$(this).next(".sch_del").toggle(Boolean($(this).val()));
		});
		$clearIpt.toggle(Boolean($ipt.val()));
		$clearIpt.click(function(){
		  $(this).prev("input").val('').focus();
		  $(this).hide();
		  $("#textlimit1").text("0");
		});


	// 메뉴용 on/off_효과
		$(".lnb_menu li>a").click(function(){
			$('.lnb_menu li').removeClass('on');
			$(this).parent('li').addClass('on');
		});
	// 양식이미지용 on/off_효과
		$(".box_imgtmb li>a").click(function(){
			$('.box_imgtmb li').removeClass('on');
			$(this).parent('li').addClass('on');
		});

	// input 선택시 전체선택/해제
	$("#sta00_all").change(function(){
	 	var chk = $(".sta00");
	 	if(this.checked){
	  	chk.prop("checked", true);
	  	chk.parent().addClass('ez-checked');
	 	}else{
	  	chk.prop("checked", false);
	  	chk.parent().removeClass('ez-checked');
	 	}
	});
	$("#stb00_all").change(function(){
	 	var chk = $(".stb00");
	 	if(this.checked){
	  	chk.prop("checked", true);
	  	chk.parent().addClass('ez-checked');
	 	}else{
	  	chk.prop("checked", false);
	  	chk.parent().removeClass('ez-checked');
	 	}
	});

	//스크롤 하단시에 selectbox 위로 열림
	$('.selects').click(function(e){
	    var ys_h = e.pageY; 
	    var cont_h = $('body').height()*0.8;
	    if( cont_h < ys_h ){
	       $(".idealSelect ul").css({"bottom":"28px"});
	    }else{
	       $(".idealSelect ul").css({"bottom":"inherit"});
	    }
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
	 	$('.tep_st02').hide();
	 	$('.tep_st01').show();
	 	$('.subtit_st01 span').text('학습미완료 보기')
	});
	$('.btn_tep_02').click(function(){
	 	$('.bt_tep > li').removeClass("on");
	 	$(this).parent().addClass('on');
	 	$('.tep_st01').hide();
	 	$('.tep_st02').show();
	 	$('.subtit_st01 span').text('학습완료 보기')
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

	
});


/* Select */
(function ($) {
    $.fn.idealForms = function () {
        var form = this;
        /* Select ***************************************************************/		
        form.find('select').each(function () {
			var select = $(this);			
			select.css({'position': 'absolute', 'margin-left': '-9999px'}); // Hide original select menu			
			var SelectMenu = { // Original select menu				
				id: select.attr('id'),
				title: select.attr('title'),	
				items: select.find('option'),
				itemsHtml: function(){
					var items = '';
					select.children('option').each(function(){
						var item = $(this).text();
						if ($(this).val() !== '') {
							$(this).attr('value', item);
						}
						items += '<li>' + '<span>' + item + '</span>' + '</li>';
					});
					return items;
				}				
			};			
			(function(){ // Create Ideal Select menu
				var html =
					'<ul class="idealSelect" id="' + SelectMenu.id + '">' + 
					'<div>' + '<span></span>' + '<li>' + SelectMenu.title + '</li>' + '</div>' + 
					'<ul>' + SelectMenu.itemsHtml() + '</ul>' + 
					'</ul>';
				select.after(html);
			}());						
			var IdealSelect = function(){ // Ideal Select menu				
				this.menu = select.next('ul');
				this.header = this.menu.children('div');
				this.headerTitle = this.header.children('li');
				this.headerArrow = this.header.children('span');
                this.dropDown =  this.menu.find('ul');
                this.items = this.dropDown.find('li');
				this.setHeight = function(){ /* Set height to fix Firefox annoying hover bug */
					var height = this.header.height();
					this.menu.css('height', height);
				};
				this.setWidth = function(){
					var maxWidth = 0;
					this.items.each(function(){
						$(this).css('fontWeight', 'bold');
						var currentWidth = $(this).width();
						if (currentWidth > maxWidth) { maxWidth = currentWidth; }
						$(this).css('fontWeight', 'normal');
					});
					//Set select width
					var itemPadding = this.items.css('padding-left').replace('px', '');
					maxWidth += (itemPadding * 2);
					this.headerTitle.width(maxWidth);		
					this.items.width(maxWidth);
					this.dropDown.width(maxWidth + (itemPadding * 2)); // For scrollbar
					// Set arrow position
					var headerHeight = this.header.outerHeight();
					var arrowHeight = form.css('font-size').replace('px', '');					
					this.headerArrow.css({
						//'left': (maxWidth) + 'px',
						//'top': ((headerHeight-(arrowHeight/2))/2) + 'px'
						'right': '0px',
						'top': '0px',
						'width': '30px',
						'height': '38px'
					});
				};				
				this.show = function(){
					select.focus();
					this.menu.addClass('menuOpen');
					this.dropDown.css('visibility', 'visible');
				};
				this.hide = function(){
					this.menu.removeClass('menuOpen');
					this.dropDown.css('visibility', 'hidden');
				};
				this.change = function(index, title){
					select.focus();
					this.headerTitle.text(title);
					SelectMenu.items
						.removeAttr('selected')
						.eq(index).attr('selected', true);
				};	
				this.next = function(){
					var title = select.find(':selected').val();
					this.headerTitle.text(title);
				};			
			};

			var idealSelect = new IdealSelect();
			idealSelect.setHeight();
			idealSelect.setWidth();
						
			// Actions			
			idealSelect.header.click(function(){ idealSelect.show(); }); // Open menu
			idealSelect.menu.hover(function(){}, function(){ idealSelect.hide(); }); // Hide menu
			idealSelect.items.click(function(){ // Change option
				var index = $(this).index();
				var title = $(this).text();
				idealSelect.change(index, title);
				idealSelect.hide();
			});
					
			select
				.focus(function(){
					idealSelect.menu.addClass('focused');
				})
				.blur(function(){
					idealSelect.menu.removeClass('focused');
				});
			
			select.keyup(function(e){ // Keyboard arrows change
				if (e.keyCode === 40 || e.keyCode === 38) {
					idealSelect.next();
				}			
			});	

            // IE z-index fix			
            var zIndexNumber = 1000;
            $('ul').each(function () {
                $(this).css('zIndex', zIndexNumber);
                zIndexNumber -= 10;
            });
            /////////////////////////////////////////////////////////////	
        });
    };

})(jQuery);
$(function(){
	$('.selects').idealForms();	
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
	$('a.cbtn').click(function(e){
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


/* Input Cleckbox */
(function($){$.fn.ezMark=function(options){options=options||{};var defaultOpt={checkboxCls:options.checkboxCls||'ez-checkbox',radioCls:options.radioCls||'ez-radio',checkedCls:options.checkedCls||'ez-checked',selectedCls:options.selectedCls||'ez-selected',hideCls:'ez-hide'};return this.each(function(){var $this=$(this);var wrapTag=$this.attr('type')=='checkbox'?'<div class="'+defaultOpt.checkboxCls+'">':'<div class="'+defaultOpt.radioCls+'">';if($this.attr('type')=='checkbox'){$this.addClass(defaultOpt.hideCls).wrap(wrapTag).change(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.checkedCls);}
else{$(this).parent().removeClass(defaultOpt.checkedCls);}});if($this.is(':checked')){$this.parent().addClass(defaultOpt.checkedCls);}}
else if($this.attr('type')=='radio'){$this.addClass(defaultOpt.hideCls).wrap(wrapTag).change(function(){$('input[name="'+$(this).attr('name')+'"]').each(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.selectedCls);}else{$(this).parent().removeClass(defaultOpt.selectedCls);}});});if($this.is(':checked')){$this.parent().addClass(defaultOpt.selectedCls);}}});}})(jQuery);



$(document).ready(function(){
	$('input[type=radio]').ezMark();
	$('input[type=checkbox]').ezMark();
	new $.Zebra_Tooltips($('.tip'));
});




