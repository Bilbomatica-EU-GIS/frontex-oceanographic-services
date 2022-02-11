class MeteogramView {
    constructor(cfg) {
        this.lat = cfg[0].Location.latitude;
        this.long = cfg[0].Location.longitude;
        this.data = cfg;
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
            Promise.all([
                fetch('https://bm-eugis.tk/marine_data/data/'+ long +'/'+ lat).then(value => value.json()),
            ])
            .then((data) => {
                this.hideLoading();
                this.loadData(this.transformData(data));
            })
            .catch((err) => {
                console.log(err);
            });
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
                if (!e.target.closest(".filter-selector") && !e.target.closest('.filter-list')) {
                    document.querySelector('.filter-list').style.display = '';
                    document.querySelector('.filter-selector').classList.remove('open');
                }
            }
        });

        document.querySelectorAll('.check-input').forEach((item) => {
            item.addEventListener('change', (e) => {
                if (e.currentTarget.checked) {
                    let value = e.currentTarget.value;
                    document.getElementById(value).style.display = '';
                }
                else {
                    let value = e.currentTarget.value;
                    document.getElementById(value).style.display = 'none';
                }
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
        data = data[0].Data;
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
        return data;
    }

    init(data) {
        this.left = document.querySelector('.group-title td').getBoundingClientRect().width;
        document.querySelectorAll('tbody .title-container').forEach((a) => {
            a.style.left = this.left + "px"
        });
        this.hideLoading();
        this.loadData(this.transformData(data));
    }

    loadData(data) {
        data = data.map(b => {b.Data = b.Data.map(a => {a.DateTime = Date.parse(a.DateTime); return a}); return b});
        data = data.map(b => {b.Data = b.Data.slice(0, 24*this.days); return b});
        this.loadDate(data);

        data.forEach((param) => {
            switch (param.VariableId) {
                case 'Wave-Sea-State':
                    this.container = document.querySelector('#sea_state');
                    this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:a.Value}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false, colors:'douglas'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Wave-Height':
                    this.container = document.querySelector('#wave_height');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100, color:this.getBackgroundColor(Math.round(a.Value * 10)/10)}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'area'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Swell-Direction-Height':
                    this.container = document.querySelector('#swell_direction');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:true, colors:'height'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Swell-Period':
                    this.container = document.querySelector('#swell_period');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false, colors:'period'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Wind-Wave-Direction-Height':
                    this.container = document.querySelector('#wind_direction');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:true, colors:'height'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Wind-Wave-Period':
                    this.container = document.querySelector('#wind_period');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false, colors:'period'};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Current-Direction-Speed':
                    this.container = document.querySelector('#current_direction');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100, direction:Math.round(a.Direction * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'simple',table:true, icon:true, colors:false};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                // case 'Tides':
                //     this.container = document.querySelector('#high_tide');
                //     this.variable = {title:param.Variable, unit:param.Units, id:param.VariableId};
                //     this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                //     this.addVariableName(this.container, this.variable);
                //     this.type = {table:true, icon:false, colors:false};
                //     this.getDataByDay(this.container, this.variable, this.data, this.type);
                //     break;
                case 'Low tide / height':
                    this.container = document.querySelector('#low_tide');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 100)/100}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
                    break;
                case 'Sea-Temperature':
                    this.container = document.querySelector('#sea_temperature');
                    this.variable = {title:param.Variable, unit:param.Units};
                    this.data = param.Data.map(a => {return {x:a.DateTime, y:Math.round(a.Value * 10)/10}});
                    this.addVariableName(this.container, this.variable);
                    this.type = {chart:true, chartType:'area',table:true, icon:false, colors:false};
                    this.getDataByDay(this.container, this.variable, this.data, this.type);
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
        d.className = "table-container";
        th.appendChild(d);
        var ta = document.createElement('table');
        ta.className = "white-table";
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
        let string = '';
        hours.forEach((i) => {
            string = string + '<td>' +
                '<div class="table-cell">' + 
                    '<span>' + (i < 10 ? '0'+ i : i) + '</span>'+
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
        let string = '';
        for (const date in daysFilter) {
            let year = new Date(date).getUTCFullYear();
            let month = new Date(date).getUTCMonth() + 1;
            let day = new Date(date).getUTCDate();
            var dayName = days[new Date(date).getDay()].toUpperCase();
            let dateString = '<div class="date-container"><b>'+ dayName +'</b> <span>'+ (day < 10 ? '0'+ day : day) +'/'+ (month < 10 ? '0'+ month : month) +'</span></div>';
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
        container.querySelector('.title-container span').innerText = variable.title +' ('+ variable.unit +')';
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
            d.className = "chart-container";
            switch (type.chartType) {
                case 'double': {
                    this.loadDoubleChart(d, variable, data);
                    break
                }
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
            dd.className = "table-container";
            td.appendChild(dd);
            var ta = document.createElement('table');
            dd.appendChild(ta);
            ta.className = 'grey-table';
            this.loadTable(ta, variable, data, type.icon, type.colors);
        }
        else if (type.table) {
            d.className = "table-container";
            var ta = document.createElement('table');
            d.appendChild(ta);
            if (variable.id == 'Wave-Sea-State') {
                this.loadSeaStateTable(ta, variable, data, type.icon, type.colors);
            } else if (variable.id == 'Tide') {
                ta.className = 'white-table';
                this.loadTide(ta, variable, data);
            }
            else {
                this.loadTable(ta, variable, data, type.icon, type.colors);
            }
        }
    }

    loadSeaStateTable(container, variable, data, icon, colors) {
        let string = '';
        let scale = this.getDouglasScale();
        data.forEach((i) => {
            string = string + '<td' + (colors && i.y ? ' style="background-color:' + scale[i.y].color +'"' : '') + '>' +
                '<div class="table-cell">' +
                    (i.y ? '<span style="cursor:pointer" tooltip="' + scale[i.y].description + '">' + i.y + '</span>' : '')+
                '</div>' +
            '</td>';
        });
        container.innerHTML = '<tr>'+string+'</tr>';
    }
        
    getDouglasScale () {
        let scale = {
            0: {height:1, color: '#E6F8FD', description: 'Calm (glassy)'},
            1: {height:1, color: '#CDF0FB', description: 'Calm (rippled)'},
            2: {height:1, color: '#B5E9F9', description: 'Smooth'},
            3: {height:1, color: '#9CE2F7', description: 'Slight'},
            4: {height:1, color: '#83DBF5', description: 'Moderate'},
            5: {height:1, color: '#6AD3F3', description: 'Rough'},
            6: {height:1, color: '#51CCF1', description: 'Very rough'},
            7: {height:1, color: '#39C5EF', description: 'High'},
            8: {height:1, color: '#20BDED', description: 'Very high'},
            9: {height:1, color: '#07B6EB', description: 'Phenomenal'}
        };
        return scale;
    }

    loadTable(container, variable, data, icon, colors) {
        let string = '';
        data.forEach((i) => {
            string = string + '<td' + (colors && i.y ? ' style="background-color:' + this.getBackgroundColor(colors, i.y) +'"' : '') + '>' +
                '<div class="table-cell">' +
                    (icon && i.direction ? '<span class="image-tooltip" tooltip="'+i.direction+' degrees" direction="up"><img src="./src/img/arrow.svg" class="arrow-icon" style="transform:rotate('+ i.direction +'deg)"></span>' :'') +
                    (i.y ? '<span>' +i.y + '</span>' : '')+
                '</div>' +
            '</td>';
        });
        container.innerHTML = '<tr>'+string+'</tr>';
    }

    getBackgroundColor(colors, value) {
        if (colors == 'period') {
            switch (true) {
                case (value < 5):
                    return "#FFFFFF"
                    break;
                case (value >= 5 && value < 10):
                    return "#FEF9E8"
                    break;
                case (value >= 10 && value < 15):
                    return "#FCF4D0"
                    break;
                case (value >= 15):
                    return "#FBEEB9"
                    break;
            }
        }
        else if (colors == 'height') {
            switch (true) {
                case (value < 1):
                    return "#DFDFFC"
                    break;
                case (value >= 1 && value < 2):
                    return "#B9BBFA"
                    break;
                case (value >= 2 && value < 4):
                    return "#F192FF"
                    break;
                case (value >= 4 && value < 6):
                    return "#FF9C86"
                    break;
                case (value >= 6):
                    return "#F8AE3E"
                    break;
            }
        }
    }

    loadTide(container, variable, data) {
        let string = '';
        data.forEach((i) => {
            let hours = new Date(i.x).getUTCHours();
            let minutes = new Date(i.x).getUTCMinutes();
            string = string +
                '<div style="position:absolute; bottom:0; left:'+ (hours + minutes/60)/24*100 +'%;">' + 
                    '<b>' + (hours < 10 ? '0'+ hours : hours) +":"+ (minutes < 10 ? '0'+ minutes : minutes) + '</b> <small>UTC</small> <b>/ '+ Math.round(i.y * 10)/10 +'</b>'+
                '</div>';
        });
        
        container.innerHTML = '<tr><td>'+string+'</td></tr>';
        container.querySelectorAll('div').forEach((elem) => {
            let position = elem.offsetWidth + elem.offsetLeft > container.offsetWidth + container.offsetLeft;
            if (position) {
                elem.style.left = '';
                elem.style.right = 0;
            }
        });
    }

    loadDoubleChart(container, variable, data) {
        Highcharts.chart({
           chart: {
                renderTo: container,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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

            tooltip: {
                shared: true,
                useHTML: true,
                headerFormat:
                    '{point.x:%A, %b %e, %H:%M}<br>' +
                    '<b>{point.point.symbolName}</b>'
            },

            xAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },
                min: data[0].x,
                max: data[data.length-1].x,
            },
            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },
            },
            plotOptions: {
                column: {
                    pointPlacement: 'between',
                    
                },
                line: {
                    pointPlacement: 'between'
                }
            },

            legend: {
                enabled: false
            },

            series: [{
                type: 'column',
                name: variable.title,
                data: data,
                tooltip: {
                    valueSuffix: ' '+ variable.unit
                },
                states: {
                    hover: {
                        enabled: false
                    }
                }
            }, {
                type: 'line',
                name: variable.title,
                data: data,
                marker: {
                    enabled: false
                },
                color: '#404040',
                enableMouseTracking: false,
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
        })
    }

    loadSimpleChart(container, variable, data) {
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
        Highcharts.chart( {
            chart: {
                renderTo: container,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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
                tickmarkPlacement: "between",
                startOnTick: true,
                endOnTick: true,
            },

            yAxis: {
                max: max,
                min: min,
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
                    valueSuffix: ' '+ variable.unit
                },
                zIndex: 1,
                color: '#07b6eb',
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
        let min = Math.min(...data.map((a)=>{return a.y}).filter((a) => a != null)) - 1;
        let max = Math.max(...data.map((a)=>{return a.y}).filter((a) => a != null)) + 1;
        Highcharts.chart( {
            chart: {
                renderTo: container,
                type: 'area',
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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


            xAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },
                categories: data.map(a => {return a.x}),
                tickmarkPlacement: "between",
                startOnTick: true,
                endOnTick: true,
            },

            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: false,
                },
                max: max,
                min: min,
            },

            legend: {
                enabled: false
            },

            tooltip: {
                shared: true,
                // useHTML: true,
                headerFormat:
                    '{point.x:%A, %b %e, %H:%M}<br>' +
                    '<b>{point.point.symbolName}</b>'
            },

            series: [{
                marker: {
                    enabled: false
                },
                name: variable.title,
                data: data.map(a => {return a.y}),
                shadow: false,
                tooltip: {
                    valueSuffix: ' '+ variable.unit
                },
                zIndex: 1,
                color: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, '#ec444180'],
                        [1, '#f7c44f80']
                    ]
                },
                lineColor: '#ec444180',
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
