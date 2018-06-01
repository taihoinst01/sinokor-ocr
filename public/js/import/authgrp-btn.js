(function($) {
    /**
     * 사용자별 메뉴 버튼권한 세팅
     */
    $.extend({
        tcbms: {
            tcbmsAuth: {
                defaults: {
                    userId: menuBtnInfo.userId,
                    menuId: menuBtnInfo.menuId,
                    grpDiv: menuBtnInfo.grpDiv,
                    programId: menuBtnInfo.programId
                },
                tcbmsAuthSetting: function(options) {
                    var self = this;
                    self.config = $.extend({}, self.defaults, options);
                    authgrp_common.bindAuthGrp(self.config);
                }
            }
        }
    });
})(jQuery);
