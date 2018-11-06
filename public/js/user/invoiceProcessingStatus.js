//import { identifier } from "babel-types";
"use strict";
var monthEngNames = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];
var dayEngNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var progressId; // progress Id

$(function () {
    dateEvent();
    _init();    
});

function _init() {
    selectChartData();
    initDate();
}

function selectChartData() {
    $.ajax({
        url: "/invoiceProcessingStatus/selectChartData",
        method: 'post',
        data: {},
        dataType: 'json',
        processData: false,
        contentType: false,
        beforeSend: function () {
            $("#progressMsgTitle").html("update Chart Data...");
            progressId = showProgressBar();
        },
        success: function (data) {
            if (data.code == 200) {
                lineChart(data.chartData); // 일간 계산서 처리 현황
                userList(data.docCountData); // 사용자별 처리 현황
                pieChart(data.ogcCountData); // 출재사별 현황
                barChart(data.chartData); // 재학습율
            } else {
                fn_alert('alert', "오류가 발생했습니다.");
            }

            endProgressBar(progressId);
        },
        error: function (e) {
            endProgressBar(progressId);
        }
    });
}

function lineChart(data) {
    var lineChartData = convertLineChartData(data);

    var lineConfig = {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
                'October', 'November', 'December'],
            datasets: [{
                label: '',
                backgroundColor: 'rgba(3,112,178,1)',
                borderColor: 'rgba(3,112,178,1)',
                data: lineChartData,
                fill: false,
            }]
        },
        options: {
            legend: {
                display: false
            },
            tooltips: {
                enabled: true,
                mode: 'index',
                position: 'nearest',
                callbacks: {
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        stepSize: 5,
                        suggestedMin: 0,
                        suggestedMax: 10,
                    }
                }]
            }
        }
    };
    var lineCtx = document.getElementById('line').getContext('2d');
    window.myLine = new Chart(lineCtx, lineConfig);
}

function convertLineChartData(data) {
    var countArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var i in data) {
        countArr[Number(data[i].YEARMONTHDAY.split('-')[1]) - 1] += Number(data[i].INVOICEPROCESSINGCOUNT);
    }

    return countArr;
}

function userList(data) {
    var waitCount = 0;
    var successCount = 0;
    var userListData = data;
    /*
    <tr>
        <td name="td_base">ICR20181018</td>
        <td name="td_base">27</td>
        <td name="td_base">1018</td>
        <td name="td_base" class="red">42%</td>
    </tr>
    */
    var tableHtml = '';
    for (var i in userListData) {
        waitCount += Number(userListData[i].DOCUMENTCOUNT);
        successCount += Number(userListData[i].SUCCESSCOUNT);
        tableHtml += '<tr>';
        tableHtml += '<td name="td_base">' + userListData[i].UPLOADNUM +'</td>';
        tableHtml += '<td name="td_base">' + userListData[i].DOCUMENTCOUNT +'</td>';
        tableHtml += '<td name="td_base">' + userListData[i].SUCCESSCOUNT +'</td>';
        tableHtml += '<td name="td_base" class="emphasis-color">' +
            ((Number(userListData[i].SUCCESSCOUNT) / Number(userListData[i].DOCUMENTCOUNT)) * 100).toFixed(0)
            + '%</td>';
        tableHtml += '</tr>';
    }
    $('.ips_user_tbody').empty().append(tableHtml);
    $('#wait_doc_count').text(waitCount)
    $('#success_doc_count').text(successCount);
}

function pieChart(data) {
    var pieChartData = convertPieChartData(data);

    var pieConfig = {
        type: 'doughnut',
        data: {
            datasets: [{
                data: pieChartData.data,
                backgroundColor: [
                    'rgba(15,142,200,1)',
                    'rgba(10,122,190,1)',
                    'rgba(3,112,178,1)',
                ],
                label: ''
            }],
            labels: pieChartData.labels
        },
        options: {
            responsive: true,
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return pieChartData.originLabels[tooltipItem.index] + " : " + data.datasets[0].data[tooltipItem.index];
                    }
                }
            }
        }
    };
    var pieCtx = document.getElementById('pie').getContext('2d');
    window.myPie = new Chart(pieCtx, pieConfig);
}

function convertPieChartData(data) {
    var pieData = {
        'originLabels': [],
        'labels': [],
        'data': []
    };
    for (var i in data) {
        pieData.originLabels.push(data[i].OGCOMPANYNAME);
        pieData.labels.push((data[i].OGCOMPANYNAME.length > 12) ? data[i].OGCOMPANYNAME.substring(0, 12) + '..' : data[i].OGCOMPANYNAME);
        pieData.data.push(data[i].OGCCOUNT);
    }
    for (var i = pieData.labels.length; i < 3; i++) {
        pieData.labels.push('');
        pieData.data.push(0);
    }

    return pieData;
}

function barChart(data) {
    var barData = convertBarChartData(data);

    var color = Chart.helpers.color;
    var barChartData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'],
        datasets: [{
            label: '',
            backgroundColor: color(window.chartColors.blue).alpha(0.3).rgbString(),
            borderColor: 'rgba(3,112,178,1)',
            borderWidth: 1,
            data: barData
        }]

    };

    var barConfig = {
        type: 'bar',
        data: barChartData,
        options: {
            responsive: true,
            legend: {
                position: '0',
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                        steps: 1,
                        stepValue: 1,
                        min: 0
                    }
                }]
            }
        }
    };

    var barCtx = document.getElementById('bar').getContext('2d');
    window.myBar = new Chart(barCtx, barConfig);
}

function convertBarChartData(data) {
    var ocrArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var retrainArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var returnArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i in data) {
        ocrArr[Number(data[i].YEARMONTHDAY.split('-')[1]) - 1] += Number(data[i].OCRCOUNT);
        retrainArr[Number(data[i].YEARMONTHDAY.split('-')[1]) - 1] += Number(data[i].RETRAINCOUNT);
    }
    for (var i in ocrArr) {
        if (ocrArr[i] != 0) {
            returnArr[i] = Number(((ocrArr[i] - retrainArr[i]) / ocrArr[i]) * 100).toFixed(2);
        } else {
            returnArr[i] = 100;
        }
    }

    return returnArr;
}

var dateEvent = function () {

    $('#year_up_btn').click(function (e) {
        var currentYear = $(e.target).next().find('.main_div').eq(0).children(0).text();

        $(e.target).next().find('.bottom_line').text(Number(currentYear) - 2);
        $(e.target).next().find('.main_div').find(':first-child').text(Number(currentYear) - 1);
        $(e.target).next().find('.top_line').text(currentYear);
    });
    $('#year_down_btn').click(function (e) {
        var currentYear = $(e.target).prev().find('.main_div').eq(0).children(0).text();

        $(e.target).prev().find('.bottom_line').text(currentYear);
        $(e.target).prev().find('.main_div').find(':first-child').text(Number(currentYear) + 1);
        $(e.target).prev().find('.top_line').text(Number(currentYear) + 2);
    });

    $('#month_up_btn').click(function (e) {
        var currentMonth = $(e.target).next().find('.main_div').eq(0).children().eq(0).text();

        if ((Number(currentMonth) - 1) > 0 && (Number(currentMonth) - 1) < 13) {
            var year = $('.ips_date_year .main_div > p').text();
            var day = $('.ips_date_day .main_div > p:eq(0)').text();
            var today = new Date(year + '-' + (Number(currentMonth) - 1) + '-' + day).getDay();

            if ((Number(currentMonth) - 1) != 1) {
                $(e.target).next().find('.bottom_line').text(Number(currentMonth) - 2);
            } else {
                $(e.target).next().find('.bottom_line').text('');
            }
            $(e.target).next().find('.main_div').find(':first-child').text(Number(currentMonth) - 1);
            $(e.target).next().find('.main_div').children().eq(1).text(monthEngNames[Number(currentMonth) - 2]);
            $('.ips_date_day .main_div > p:eq(1)').text(dayEngNames[today]);
            if ((Number(currentMonth) - 1) != 12) {
                $(e.target).next().find('.top_line').text(currentMonth);
            } else {
                $(e.target).next().find('.top_line').text('');
            }
        }
    });
    $('#month_down_btn').click(function (e) {
        var currentMonth = $(e.target).prev().find('.main_div').eq(0).children().eq(0).text();

        if ((Number(currentMonth) + 1) > 0 && (Number(currentMonth) + 1) < 13) {
            var year = $('.ips_date_year .main_div > p').text();
            var day = $('.ips_date_day .main_div > p:eq(0)').text();
            var today = new Date(year + '-' + (Number(currentMonth) + 1) + '-' + day).getDay();

            if ((Number(currentMonth) + 1) != 1) {
                $(e.target).prev().find('.bottom_line').text(currentMonth);
            } else {
                $(e.target).prev().find('.bottom_line').text('');
            }
            $(e.target).prev().find('.main_div').find(':first-child').text(Number(currentMonth) + 1);
            $(e.target).prev().find('.main_div').children().eq(1).text(monthEngNames[Number(currentMonth)]);
            $('.ips_date_day .main_div > p:eq(1)').text(dayEngNames[today]);
            if ((Number(currentMonth) + 1) != 12) {
                $(e.target).prev().find('.top_line').text(Number(currentMonth) + 2);
            } else {
                $(e.target).prev().find('.top_line').text('');
            }
        }
    });

    $('#day_up_btn').click(function (e) {
        var currentday = $(e.target).next().find('.main_div').eq(0).children().eq(0).text();

        if ((Number(currentday) - 1) > 0 && (Number(currentday) - 1) < 32) {
            var year = $('.ips_date_year .main_div > p').text();
            var month = $('.ips_date_month .main_div > p:eq(0)').text();
            var today = new Date(year + '-' + month + '-' + (Number(currentday) - 1)).getDay();

            if ((Number(currentday) - 1) != 1) {
                $(e.target).next().find('.bottom_line').text(Number(currentday) - 2);
            } else {
                $(e.target).next().find('.bottom_line').text('');
            }
            $(e.target).next().find('.main_div').find(':first-child').text(Number(currentday) - 1);
            $(e.target).next().find('.main_div').children().eq(1).text(dayEngNames[today]);
            if ((Number(currentday) - 1) != 31) {
                $(e.target).next().find('.top_line').text(currentday);
            } else {
                $(e.target).next().find('.top_line').text('');
            }
        }
    });
    $('#day_down_btn').click(function (e) {
        var currentday = $(e.target).prev().find('.main_div').eq(0).children().eq(0).text();

        if ((Number(currentday) + 1) > 0 && (Number(currentday) + 1) < 32) {
            var year = $('.ips_date_year .main_div > p').text();
            var month = $('.ips_date_month .main_div > p:eq(0)').text();
            var today = new Date(year + '-' + month + '-' + (Number(currentday) + 1)).getDay();

            if ((Number(currentday) + 1) != 1) {
                $(e.target).prev().find('.bottom_line').text(currentday);
            } else {
                $(e.target).prev().find('.bottom_line').text('');
            }
            $(e.target).prev().find('.main_div').find(':first-child').text(Number(currentday) + 1);
            $(e.target).prev().find('.main_div').children().eq(1).text(dayEngNames[today]);
            if ((Number(currentday) + 1) != 31) {
                $(e.target).prev().find('.top_line').text(Number(currentday) + 2);
            } else {
                $(e.target).prev().find('.top_line').text('');
            }
        }
    });

    $('#roll_back_btn').click(function (e) {                
        var year = $('.ips_date_year .main_div > p').text();
        var month = $('.ips_date_month .main_div > p:eq(0)').text();
        month = month.length == 1 ? '0' + month : month;
        var day = $('.ips_date_day .main_div > p:eq(0)').text();
        day = day.length == 1 ? '0' + day : day;

        var date = year + month + day

        $.ajax({
            url: "/common/rollback",
            method: 'post',
            data: JSON.stringify({date:date}),
            dataType: 'json',
            processData: false,
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                $("#progressMsgTitle").html("Roll Back Data...");
                progressId = showProgressBar();
            },
            success: function (data) {
                if (data.code == 200) {
                    fn_alert('alert', data.message);
                } else {
                    fn_alert('alert', "오류가 발생했습니다.");
                }

                endProgressBar(progressId);
            },
            error: function (e) {
                endProgressBar(progressId);
            }
        });

    });

};

function initDate() {
    var d = new Date();
    $('.ips_date_year .bottom_line:eq(0)').text(d.getFullYear() - 1);
    $('.ips_date_year .main_div > p').text(d.getFullYear());
    $('.ips_date_year .top_line:eq(0)').text(d.getFullYear() + 1);

    if (d.getMonth() != 0) {
        $('.ips_date_month .bottom_line:eq(0)').text(d.getMonth());
    } else {
        $('.ips_date_month .bottom_line:eq(0)').text('');
    }
    $('.ips_date_month .main_div > p:eq(0)').text(d.getMonth() + 1);
    $('.ips_date_month .main_div > p:eq(1)').text(monthEngNames[d.getMonth()]);
    if (d.getMonth() != 11) {
        $('.ips_date_month .top_line:eq(0)').text(d.getMonth() + 2);
    } else {
        $('.ips_date_month .top_line:eq(0)').text('');
    }

    if (d.getDate() != 1) {
        $('.ips_date_day .bottom_line:eq(0)').text(d.getDate() - 1);
    } else {
        $('.ips_date_day .bottom_line:eq(0)').text('');
    }
    $('.ips_date_day .main_div > p:eq(0)').text(d.getDate());
    $('.ips_date_day .main_div > p:eq(1)').text(dayEngNames[d.getDay()]);

    if (d.getDate() != 31) {
        $('.ips_date_day .top_line:eq(0)').text(d.getDate() + 1);
    } else {
        $('.ips_date_day .top_line:eq(0)').text('');
    }
}