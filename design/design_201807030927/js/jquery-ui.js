
jQuery(function($){

	/* 메인지도하단컨텐츠_좌우이동_효과 */
		$('.btn_reduction').click(function(){
			$('.lnb_menu').animate({'width':'50px'},250);
			$('#content').animate({'margin-left':'49px'},250);
			$(this).hide();
			$('.btn_expansion').show();
			$('.lnb_menu').addClass('on');
			$('.lnb_menu h3 span, .lnb_menu li a span').fadeOut(100);	



		});
		$('.btn_expansion').click(function(){
			$('.lnb_menu').animate({'width':'204px'},250);
			$('#content').animate({'margin-left':'205px'},250);
			$(this).hide();
			$('.btn_reduction').show();
			$('.lnb_menu').removeClass('on');			
			$('.lnb_menu h3 span, .lnb_menu li a span').delay(200).fadeIn(100);	




		});

	/* 메뉴용on_효과 */
		$(".lnb_menu li>a").click(function(){
			$('.lnb_menu li').removeClass('on');
			$(this).parent('li').addClass('on');
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
						'width': '24px',
						'height': '28px'
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
	if (temp.outerWidth() < $(document).width() ) temp.css('margin-left', '-354px');
	else temp.css('left', '0px');
	//	temp.find('a.cbtn').click(function(e){
	$('a.cbtn').click(function(e){
		if(bg){
			$('.poplayer').fadeOut(); //'bg' 클래스가 존재하면 레이어를 사라지게 한다. 
		}else{
			temp1.fadeOut();
		}
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
	$('.box_login').mousemove(function(){
		if($('.input_pw').val().length > 0){
			$('.input_pw').parent().find('label').show();
		}
	});
	$('.box_input input').blur(function(){
		if(this.value==""){
			$(this).parent().find('label').show();
		}
	});
});


/* Input Cleckbox */
(function($){$.fn.ezMark=function(options){options=options||{};var defaultOpt={checkboxCls:options.checkboxCls||'ez-checkbox',radioCls:options.radioCls||'ez-radio',checkedCls:options.checkedCls||'ez-checked',selectedCls:options.selectedCls||'ez-selected',hideCls:'ez-hide'};return this.each(function(){var $this=$(this);var wrapTag=$this.attr('type')=='checkbox'?'<div class="'+defaultOpt.checkboxCls+'">':'<div class="'+defaultOpt.radioCls+'">';if($this.attr('type')=='checkbox'){$this.addClass(defaultOpt.hideCls).wrap(wrapTag).change(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.checkedCls);}
else{$(this).parent().removeClass(defaultOpt.checkedCls);}});if($this.is(':checked')){$this.parent().addClass(defaultOpt.checkedCls);}}
else if($this.attr('type')=='radio'){$this.addClass(defaultOpt.hideCls).wrap(wrapTa).change(function(){$('input[name="'+$(this).attr('name')+'"]').each(function(){if($(this).is(':checked')){$(this).parent().addClass(defaultOpt.selectedCls);}else{$(this).parent().removeClass(defaultOpt.selectedCls);}});});if($this.is(':checked')){$this.parent().addClass(defaultOpt.selectedCls);}}});}})(jQuery);
$(document).ready(function(){
	$('input[type=radio]').ezMark();
	$('input[type=checkbox]').ezMark();
});
