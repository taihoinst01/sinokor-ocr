//import { identifier } from "babel-types";
"use strict";
var monthEngNames = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];
var dayEngNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var progressId; // progress Id


$(function () {
    _init();
    dateEvent();
});

function _init() {
    lineChart();
    pieChart();
    barChart();
}

function barChart() {

    var color = Chart.helpers.color;
    var barChartData = {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [{
            label: '',
            backgroundColor: color(window.chartColors.blue).alpha(0.3).rgbString(),
            borderColor: 'rgba(3,112,178,1)',
            borderWidth: 1,
            data: [
                6,
                7,
                5,
                4,
                7
            ]
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

function lineChart() {
    var lineConfig = {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: '',
                backgroundColor: 'rgba(3,112,178,1)',
                borderColor: 'rgba(3,112,178,1)',
                data: [5, 4, 7, 8, 3, 3, 0],
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
                        stepSize: 1,
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

function pieChart() {
    var pieConfig = {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [65, 12, 23],
                backgroundColor: [
                    'rgba(15,142,200,1)',
                    'rgba(10,122,190,1)',
                    'rgba(3,112,178,1)',
                ],
                label: ''
            }],
            labels: [
                'ICR2018',
                'ICR2018',
                'ICR2018'
            ]
        },
        options: {
            responsive: true
        }
    };
    var pieCtx = document.getElementById('pie').getContext('2d');
    window.myPie = new Chart(pieCtx, pieConfig);
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
        
    });

};