(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var weburl = window.location.href;
        if (weburl.indexOf('hax.co.id/create-vps') > 0) {

            // 操作系统：选择第 7 个有效项（排除 -select-）
            var os = document.getElementById("os");
            var validOS = [];
            for (var i = 0; i < os.options.length; i++) {
                var txt = os.options[i].textContent.trim().toLowerCase();
                if (txt !== '' && txt !== '-select-') {
                    validOS.push({ index: i, text: txt });
                }
            }
            if (validOS.length >= 7) {
                os.selectedIndex = validOS[6].index; // 第 7 个有效项
            }

            //  设置密码
            document.getElementById("password").value = "yourpassword";

            //  用途：选第 6 项
            var purpose = document.getElementById("purpose");
            if (purpose.options.length > 5) {
                purpose.selectedIndex = 5; // 比如第 6 项
            }

            //  勾选协议
            var am = document.getElementsByName("agreement[]");
            for (var i = 0; i < am.length; i++) {
                am[i].checked = true;
            }

            //  检查数据中心是否有效
            var dc = document.getElementById("datacenter");
            var valid = false;
            for (var i = 0; i < dc.options.length; i++) {
                var txt = dc.options[i].textContent.trim().toLowerCase();
                if (txt !== '' && txt !== '-select-') {
                    valid = true;
                    break;
                }
            }

            //  没有有效数据中心就延迟刷新
            if (!valid) {
                setTimeout(function() {
                    window.location.reload();
                }, 100);
                return;
            }

            //  有就选最后一个
            dc.selectedIndex = dc.options.length - 1;

            //  延迟 2.5 秒后点击创建按钮
            setTimeout(function() {
                var btn = document.getElementsByName("submit_button")[0];
                if (btn) btn.click();
            }, 6000);   //  延迟 2.5 秒
        }
    });
})();
