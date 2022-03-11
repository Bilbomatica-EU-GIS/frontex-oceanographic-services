class MeteogramView {
    constructor(cfg) {
        this.lat = cfg[0].Location.latitude;
        this.long = cfg[0].Location.longitude;
        this.data = cfg[0].Data;
        this.days = 2;
        this.dates;
        this.init(this.data);
        
        document.querySelector('.time-switch').addEventListener('change',(e) => {
            this.removeContainers();
            if (e.currentTarget.checked) {
                this.days = 7;
            }
            else {
                this.days = 2;
            }
            this.loadData(this.data);
            this.hideLoading();
        });

        document.querySelector('.filter-selector').addEventListener('click',(e) => {
            if (e.currentTarget.classList.contains('open')) {
                document.querySelector('.filter-list').style.display = '';
                document.querySelector('.filter-selector').classList.remove('open');
            }
            else {
                document.querySelector('.filter-list').style.display = 'block';
                document.querySelector('.filter-selector').classList.add('open');
            }
        });

        document.addEventListener('click',(e) => {
            if (document.querySelector('.filter-selector').classList.contains('open')) {
                if (!e.target.closest('.filter-selector') && !e.target.closest('.filter-list')) {
                    document.querySelector('.filter-list').style.display = '';
                    document.querySelector('.filter-selector').classList.remove('open');
                }
            }
        });

        document.querySelectorAll('.check-input').forEach((item) => {
            item.addEventListener('change', (e) => {
                let value = e.currentTarget.value;
                let group = document.getElementById(value).parentElement.id;
                if (e.currentTarget.checked) {
                    document.getElementById(value).style.display = '';
                }
                else {
                    document.getElementById(value).style.display = 'none';
                }
                this.checkGroup(group);
            });
        });

        document.querySelectorAll('.info-icon').forEach((item) => {
            item.addEventListener('mouseover', (e) => {
                let info = e.currentTarget.dataset.info;
                let legend = document.querySelector('#legend_' + info);
                let title = e.currentTarget.nextElementSibling.innerText;
                let top = e.currentTarget.getBoundingClientRect().top - document.body.getBoundingClientRect().top + 16;
                let left = e.currentTarget.getBoundingClientRect().left - document.body.getBoundingClientRect().left + 16;
                legend.style.top = top + 'px';
                legend.style.left = left + 'px';
                legend.style.display = 'inline-block';
                legend.querySelector('.legend-title').innerText = title;
            });
            item.addEventListener('mouseout', (e) => {
                let info = e.currentTarget.dataset.info;
                let legend = document.querySelector('#legend_' + info);
                legend.style.display = 'none';
            });
        });
    }

    checkGroup(group) {
        let items = document.getElementById(group).querySelectorAll('.line-container');
        let hidden = [];
        items.forEach((a)=> {
            if(a.style.display == 'none'){
                hidden.push(a)
            }
        });
        if (items.length == hidden.length) {
            document.getElementById(group).querySelector('.group-title').style.display = 'none';
        }
        else if (items.length - hidden.length > 0) {
            document.getElementById(group).querySelector('.group-title').style.display = '';
        }
    }

    removeContainers() {
        document.querySelectorAll('tbody .line-container td:not(.title-container)').forEach((line) => {
            line.remove();
        });
        document.querySelectorAll('thead .line-container th:not([colspan])').forEach((line) => {
            line.remove();
        });
        this.showLoading();
    }

    showLoading() {
        document.querySelector('body').style.overflow = 'hidden';
        document.querySelector('.loading-container').style.display = '';
    }

    hideLoading() {
        document.querySelector('body').style.overflow = '';
        document.querySelector('.loading-container').style.display = 'none';
    }

    transformData(data) {
        let compoundVariables = ['Swell-Direction','Wind-Wave-Direction','Currents-Vector'];
        let swell = data.find((a) => a.VariableId == 'Swell-Height');
        let swellVector = data.find((a) => a.VariableId == 'Swell-Direction');
        swell.Units = 'm';
        swell.Variable = 'Swell direction and height';
        swell.VariableId = 'Swell-Direction-Height';
        swell.Data.forEach((item,index)=>{
            item.Direction = swellVector.Data[index].Value;
        });
        let wind = data.find((a) => a.VariableId == 'Wind-Wave-Height');
        let windVector = data.find((a) => a.VariableId == 'Wind-Wave-Direction');
        wind.Units = 'm';
        wind.Variable = 'Wind wave direction and height';
        wind.VariableId = 'Wind-Wave-Direction-Height';
        wind.Data.forEach((item,index) => {
            item.Direction = windVector.Data[index].Value;
        });
        let current = data.find((a)=>a.VariableId == 'Currents');
        let currentVector = data.find((a) => a.VariableId == 'Currents-Vector');
        current.Units = 'm/s';
        current.Variable = 'Current direction and speed';
        current.VariableId = 'Current-Direction-Speed';
        current.Data.forEach((item,index) => {
            item.Direction = currentVector.Data[index].Value;
        });
        data = data.filter((a) => !compoundVariables.includes(a.VariableId));
        data = data.map(b => {b.Data = b.Data.map(a => {a.DateTime = Date.parse(a.DateTime); return a}); return b});
        this.data = data;
        return data;
    }

    init(data) {
        this.left = document.querySelector('.group-title td').getBoundingClientRect().width;
        document.querySelectorAll('tbody .title-container').forEach((a) => {
            a.style.left = this.left + 'px';
        });
        this.hideLoading();
        this.loadData(this.transformData(data));
    }

    loadData(data) {
        let filterData = data.map(obj => ({...obj})).map(b => {b.Data = b.Data.slice(0, 24*this.days); return b});
        this.loadDate(filterData);

        filterData.forEach((param) => {
            switch (param.VariableId) {
                case 'Wave-Sea-State':
                    this.container = document.querySelector('#sea_state');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:a.Value}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Wave-Height':
                    this.container = document.querySelector('#wave_height');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10, color:this.getBackgroundColor(Math.round(a.Value * 10)/10)}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'area', table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Swell-Direction-Height':
                    this.container = document.querySelector('#swell_direction');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:true, colors:true};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Swell-Period':
                    this.container = document.querySelector('#swell_period');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Wind-Wave-Direction-Height':
                    this.container = document.querySelector('#wind_direction');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:true, colors:true};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Wind-Wave-Period':
                    this.container = document.querySelector('#wind_period');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Current-Direction-Speed':
                    this.container = document.querySelector('#current_direction');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'simple', table:true, icon:true, colors:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Tides':
                    this.container = document.querySelector('#tides');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'area', table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
                case 'Sea-Temperature':
                    this.container = document.querySelector('#sea_temperature');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.chartData = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'simple', table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.chartData, this.type);
                    break;
            }
        });
    }

    loadDate(data) {
        let index = data.map((a)=>{return a.Data}).reduce((a, arr, idx) => arr.length > data[a].length ? idx : a, 0);
        data = data[index].Data;
        let container = document.querySelector('#hours');
        var th = document.createElement('th');
        th.className = 'hours-container';
        var d = document.createElement('div');
        d.className = 'table-container';
        th.appendChild(d);
        var ta = document.createElement('table');
        ta.className = 'white-table';
        d.appendChild(ta);
        container.appendChild(th);
        if (this.days == 7) {
            data = this.filterDataHours(data);
        }
        this.dates = data.map(a => {return a.DateTime});
        this.loadHours(ta, data);
        this.loadDays(data);
    }

    loadHours(container, data) {
        let hours = this.dates.map(d => {return new Date(d).getUTCHours()});
        let string = '<td class="table-cell empty-cell"></td>';
        hours.forEach((i) => {
            string = string + '<td>' +
                '<div class="table-cell">' + 
                    '<span>' + (i < 10 ? '0' + i : i) + '</span>' +
                '</div>' +
            '</td>';
        });
        container.innerHTML = '<tr>' + string + '</tr>';
    };

    loadDays(data) {
        let dates = this.dates.map(d => {return new Date(d).getUTCFullYear() + '/' + (new Date(d).getUTCMonth() + 1) + '/' + new Date(d).getUTCDate()});
        let daysFilter = dates.reduce((acc, val) => {
            acc[val] = acc[val] === undefined ? 1 : acc[val] += 1;
            return acc;
        }, {});
        var dateContainer = document.querySelector('#time');
        var t = document.createElement('th');
        var d = document.createElement('div');
        d.className = 'table-container';
        t.appendChild(d);
        var ta = document.createElement('table');
        ta.className = 'white-table';
        d.appendChild(ta);
        dateContainer.appendChild(t);
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let string = '<td class="table-cell empty-cell"></td>';
        for (const date in daysFilter) {
            let month = new Date(date).getMonth() + 1;
            let day = new Date(date).getDate();
            var dayName = days[new Date(date).getDay()].toUpperCase();
            let dateString = '<div class="date-container"><b>' + dayName + '</b> <span>' + (day < 10 ? '0' + day : day) + '/' + (month < 10 ? '0' + month : month) + '</span></div>';
            string = string + '<td colspan=' + daysFilter[date] + ' width=' + daysFilter[date]/data.length*100 + '%>' + dateString + '</td>';
        }
        ta.innerHTML = '<tr>' + string + '</tr>';
    }

    filterDataHours(data) {
        let f = [];
        for (let i = -2; i < this.days*24; i++) {
            i = i + 2;
            f.push(i);
        }
        return data.length > 4/24*100 ? data.filter((a, i) => {return f.indexOf(i) != -1}) : data;
    }

    addVariableName(container, variable) {
        container.querySelector('.title-container span').innerText = variable.title + ' (' + variable.unit + ')';
        document.querySelector('input[value="' + container.id + '"]').parentElement.querySelector('label').innerText = variable.title;
    }

    getDataByDay(container, variable, data, type) {
        var td = document.createElement('td');
        var d = document.createElement('div');
        td.appendChild(d);
        container.appendChild(td);
        if (this.days == 7){
            data = this.filterDataHours(data);
        }
        if (this.dates.length != data.length) {
            let leftDates = this.dates.filter(x => !data.map((a) => {return a.x}).includes(x));
            leftDates.forEach((date) => {
                data.push({x: date, y: null, direction: null});
            });
        }
        if (type.chart) {
            d.className = 'chart-container';
            switch (type.chartType) {
                case 'simple': {
                    this.loadSimpleChart(d, variable, data);
                    break
                }
                case 'area': {
                    this.loadAreaChart(d, variable, data);
                    break
                }
            }
        }
        if (type.chart && type.table) {
            var dd = document.createElement('div');
            dd.className = 'table-container';
            td.appendChild(dd);
            var ta = document.createElement('table');
            dd.appendChild(ta);
            ta.className = 'grey-table';
            this.loadTable(ta, variable, data, type.icon, type.colors);
        }
        else if (type.table) {
            d.className = 'table-container';
            var ta = document.createElement('table');
            d.appendChild(ta);
            ta.className = 'grey-table';
            this.loadTable(ta, variable, data, type.icon, type.colors);
        }
    }

    loadTable(container, variable, data, icon, colors) {
        let string = '<td class="table-cell empty-cell"></td>';
        if (variable.id == 'Wave-Sea-State') {
            let scale = this.getDouglasScale();
            data.forEach((i) => {
                string = string + '<td' + (i.y != null ? ' style="background-color:' + scale[i.y].color + '"' : '') + '>' +
                    '<div class="table-cell">' +
                        (i.y != null ? '<span style="cursor:pointer" tooltip="' + scale[i.y].description + '">' + i.y + '</span>' : '') +
                    '</div>' +
                '</td>';
            });
        }
        else {
            data.forEach((i) => {
                string = string + '<td' + (colors && i.y != null ? ' style="background-color:' + this.getBackgroundColor(i.y) + '"' : '') + '>' +
                    '<div class="table-cell">' +
                        (icon && i.direction ? '<span class="image-tooltip" tooltip="' + i.direction + ' degrees" direction="up"><img src="./src/img/arrow.svg" class="arrow-icon" style="transform:rotate(' + i.direction + 'deg)"></span>' :'') +
                        (i.y != null ? '<span>' + i.y + '</span>' : '') +
                    '</div>' +
                '</td>';
            });
        }
        container.innerHTML = '<tr>' + string + '</tr>';
    }

    getDouglasScale () {
        let scale = {
            0: {height:1, color: '#CEE7C3', description: 'Calm (glassy)'},
            1: {height:1, color: '#9CCF87', description: 'Calm (rippled)'},
            2: {height:1, color: '#CADD77', description: 'Smooth'},
            3: {height:1, color: '#F8EA66', description: 'Slight'},
            4: {height:1, color: '#FAD16C', description: 'Moderate'},
            5: {height:1, color: '#FCB771', description: 'Rough'},
            6: {height:1, color: '#F48B70', description: 'Very rough'},
            7: {height:1, color: '#EC5F6E', description: 'High'},
            8: {height:1, color: '#D07D9C', description: 'Very high'},
            9: {height:1, color: '#B49BCA', description: 'Phenomenal'}
        };
        return scale;
    }

    getBackgroundColor(value) {
        switch (true) {
            case (value < 0.5):
                return '#CEE7C3'
            case (value >= 0.5 && value < 1):
                return '#9CCF87'
            case (value >= 1 && value < 1.5):
                return '#CADD77'
            case (value >= 1.5 && value < 2):
                return '#F8EA66'
            case (value >= 2 && value < 3):
                return '#FAD16C'
            case (value >= 3 && value < 4):
                return '#FCB771'
            case (value >= 4 && value < 5):
                return '#F48B70'
            case (value >= 5 && value < 6):
                return '#EC5F6E'
            case (value >= 6 && value < 7):
                return '#D07D9C'
            case (value >= 7):
                return '#B49BCA'
        }
    }

    loadSimpleChart(container, variable, data) {
        let min = Math.min(...data.map((a)=>{return a.y}).filter((a) => a != null));
        let max = Math.max(...data.map((a)=>{return a.y}).filter((a) => a != null));
        if (variable.id == 'Sea-Temperature') {
            min = min - 1;
            max = max + 1;
        }
        else {
            if (max-min < 1) {
                min = min - 0.1;
                max = max + 0.1;
            }
            else {
                min = min - 1;
                max = max + 1;
            }
            if (variable.id == 'Current-Direction-Speed') {
                min = min <= 0 ? 0 : min;
            } 
        }
        Highcharts.chart( {
            chart: {
                renderTo: container,
                marginRight: 0,
                marginBottom: 12,
                marginLeft: 48,
            },

            title: {
                text: '',
                style: {
                    display: 'none'
                }
            },

            subtitle: {
                text: '',
                style: {
                    display: 'none'
                }
            },

            plotOptions: {
                line: {
                    pointPlacement: 'between'
                }
            },

            xAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },

                categories: data.map( a=> {return a.x}),
                tickmarkPlacement: 'between',
                startOnTick: true,
                endOnTick: true,
            },

            yAxis: {
                title: '',
                max: max,
                min: min,
                plotLines: [{
                    color: 'black',
                    width: 1.5,
                    value: 0
                }],
            },

            legend: {
                enabled: false
            },

            tooltip: {
                shared: true,
                useHTML: true,
                headerFormat:
                    '{point.x:%A, %b %e, %H:%M}<br>' +
                    '<b>{point.point.symbolName}</b>'
            },

            series: [{
                marker: {
                    enabled: false
                },
                name: variable.title,
                data: data.map( a=> {return a.y}),
                shadow: false,
                tooltip: {
                    valueSuffix: ' ' + variable.unit
                },
                zIndex: 1,
                color: '#07B6EB80',
            }],

            exporting: {
                buttons: {
                    contextButton: {
                        enabled: false
                    }
                }
            },

            credits: {
                enabled: false
            },
        });
    }

    loadAreaChart(container, variable, data) {
        let min = Math.min(...data.map((a)=>{return a.y}).filter((a) => a != null));
        let max = Math.max(...data.map((a)=>{return a.y}).filter((a) => a != null));
        if (max-min < 1) {
            min = min - 0.1;
            max = max + 0.1;
        }
        else {
            min = min - 1;
            max = max + 1;
        }
        if (variable.id == 'Wave-Height') {
            min = min <= 0 ? 0 : min;
        }
        let colors = {};
        colors.c1 = '#07B6EB80';
        colors.c2 = '#52CEF380';
        colors.c3 = '#9DE5FB80';
        if (variable.id == 'Tides') {
            colors.c1 = '#52CEF380';
            colors.c2 = '#9DE5FB80';
        }
        
        Highcharts.chart( {
            chart: {
                renderTo: container,
                type: 'area',
                marginRight: 0,
                marginBottom: 12,
                marginLeft: 48,
            },

            title: {
                text: '',
                style: {
                    display: 'none'
                }
            },

            subtitle: {
                text: '',
                style: {
                    display: 'none'
                }
            },

            plotOptions: {
                series: {
                    color: '#07B6EB80'
                }
            },


            xAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },
                categories: data.map(a => {return a.x}),
                tickmarkPlacement: 'between',
                startOnTick: true,
                endOnTick: true,
            },

            yAxis: {
                title: {
                    text: ''
                },
                labels: {
                    enabled: true,
                },
                max: max,
                min: min,
                plotLines: [{
                    color: 'black',
                    width: 1.5,
                    value: 0
                }],
            },

            legend: {
                enabled: false
            },

            tooltip: {
                shared: true,
                useHTML: true,
                headerFormat:
                    '{point.x:%A, %b %e, %H:%M}<br>' +
                    '<b>{point.point.symbolName}</b>'
            },

            series: [{
                marker: {
                    enabled: false,
                },
                name: variable.title,
                data: data.map(a => {return a.y}),
                shadow: false,
                tooltip: {
                    valueSuffix: ' ' + variable.unit
                },
                zIndex: 1,
                fillColor : {
                    linearGradient: {
                        x1: 0,
                        x2: 0,
                        y1: 0,
                        y2: 1
                    },
                    stops: [
                        [0, colors.c1],
                        [0.5, colors.c2],
                        [1, colors.c3]
                    ],
                },
                zones: [{
                    value: 0,
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 1,
                            x2: 0,
                            y2: 0
                        },
                        stops: [
                            [0, colors.c1],
                            [0.5, colors.c2],
                            [1, colors.c3]
                        ],
                    },
                  }]
            }],

            exporting: {
                buttons: {
                    contextButton: {
                        enabled: false
                    }
                }
            },

            credits: {
                enabled: false
            },
        });
    }
}
