(() => {
    const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=35.6785&longitude=139.6823&hourly=temperature_2m,weathercode&current_weather=true&timezone=Asia%2FTokyo&past_days=2';

    const hoursOfDay = 24;

    const sliceArrays = (array, number) => [...Array(Math.ceil(array.length / number))].map((_, index) => array.slice(index * number, (index + 1) * number));

    const getDay = dateTimeStr => {
        const jstDate = new Date(new Date(dateTimeStr) + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
        return ['日', '月', '火', '水', '木', '金', '土'][jstDate.getDay()];
    };


    //天気の定義とアイコン設定
    const generateWeatherIcon = weatherCode => {
    // https://www.jodc.go.jp/data_format/weather-code_j.html
        const iconText = (() => {
            if(weatherCode === 0) return { text: '快晴'  , emoji: '☀' };  // 0 : Clear Sky
            if(weatherCode === 1) return { text: '晴れ'  , emoji: '🌤' };  // 1 : Mainly Clear
            if(weatherCode === 2) return { text: '一部曇', emoji: '⛅' };  // 2 : Partly Cloudy
            if(weatherCode === 3) return { text: '曇り'  , emoji: '☁' };  // 3 : Overcast
            if(weatherCode <= 49) return { text: '霧'    , emoji: '🌫' };  // 45, 48 : Fog ☁And Depositing Rime Fog
            if(weatherCode <= 59) return { text: '霧雨'  , emoji: '🌧' };  // 51, 53, 55 : Drizzle Light, Moderate And Dense Intensity ・ 56, 57 : Freezing Drizzle Light And Dense Intensity
            if(weatherCode <= 69) return { text: '雨'    , emoji: '☔' };  // 61, 63, 65 : Rain Slight, Moderate And Heavy Intensity ・66, 67 : Freezing Rain Light And Heavy Intensity
            if(weatherCode <= 79) return { text: '雪'    , emoji: '☃' };  // 71, 73, 75 : Snow Fall Slight, Moderate And Heavy Intensity ・ 77 : Snow Grains
            if(weatherCode <= 84) return { text: 'にわか雨', emoji: '🌧' };  // 80, 81, 82 : Rain Showers Slight, Moderate And Violent
            if(weatherCode <= 94) return { text: '雪・雹', emoji: '☃' };  // 85, 86 : Snow Showers Slight And Heavy
            if(weatherCode <= 99) return { text: '雷雨'  , emoji: '⛈' };  // 95 : Thunderstorm Slight Or Moderate ・ 96, 99 : Thunderstorm With Slight And Heavy Hail
            return                       { text: '不明'  , emoji: '✨' };
        })();
        return `<span title="${iconText.text}">${iconText.emoji}</span>`;
    };

    //表作成関数
    const generateHtml = (currentWeather, hourly) => {
        //現況表示
        const header = `
        <h2 class="text-center">${currentWeather.time.replace('T', ` (${getDay(currentWeather.time)}) `)} 現在 ${generateWeatherIcon(currentWeather.weathercode)} ${currentWeather.temperature} °C</h2>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Date</th>`
                    + [...Array(hoursOfDay).keys()].map(hour => `<th>${String(hour).padStart(2, '0')}時</th>`).join('')
                    + `
                </tr>
            </thead>
            <tbody>
        `;
        //予報テーブル表示
        const body = sliceArrays(hourly.weathercode, hoursOfDay)
        .map(weatherCodes => {
            while(weatherCodes.length < hoursOfDay) weatherCodes.push(100);  // 1日分に満たない配列がありうるので「不明」な値を差し込む
            return weatherCodes;
        })
        .reduce((bodyHtml, weatherCodes, index) => {
            const rawDateTime = hourly.time[index * hoursOfDay];
            const date = rawDateTime.replace((/T.*/u), ` (${getDay(rawDateTime)})`);
            const weathersHtml = weatherCodes.reduce((dateHtml, weatherCode) => `${dateHtml}<td>${generateWeatherIcon(weatherCode)}</td>`, '');
            return `${bodyHtml}<tr><td>${date}</td>${weathersHtml}</tr>`;
        }, '');
        //リロードボタン
        const footer = `
            </tbody>
        </table>
        <span><button type="button" id="reload" class="btn btn-dark">Reload</button></span>
        `;
        //挿入
        return `${header}${body}${footer}`;
    };


    // 非同期処理
    const main = async () => {
        const contents = document.getElementById('contents');
        if(!contents) return alert('The #contents Element Does Not Exist');
        //bodyのdivタグにcontentsを認識
        try {
            contents.classList.remove('loaded');
            contents.innerHTML =
                '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><div><b>Loading...</b></div>';
            const data = await window.fetch(apiUrl).then(response => response.json());
            console.log('Fetch Open Meteo API', data);
            contents.innerHTML = generateHtml(data.current_weather, data.hourly);
            const reload = document.getElementById('reload');
            if(reload) reload.addEventListener('click', main);
            contents.classList.add('loaded');
        }
        catch(error) {
            console.warn('Error', error);
            contents.innerHTML = `<div><strong>Failed To Fetch Open Meteo API : ${error}</strong></div>`;
        }
    };

    document.addEventListener('DOMContentLoaded', main);
})();