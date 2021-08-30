const databaseUrl = document.currentScript.getAttribute('data-url')

let radarId;
let blipsVersion;

getRadarId().then(async function(x) {
    radarId = x
    try {
        const response = await fetch(`${databaseUrl}/radar/${radarId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            //mode: 'no-cors',
        })
        if (response.status === 404) {
            blipsVersion = 0
        } else {
            blipsVersion = parseInt(response.headers.get('blips-version'));
        }
    } catch (e) {
        blipsVersion = 0;
    }
});

async function loadEthercalc() {
    const url = `${window.location.pathname}.csv.json`
    const response = await fetch(url)
    return await response.json()
}

async function getRadarId() {
    const data = await loadEthercalc()

    const paramHeaders = ['name', 'value']
    const paramIndexes = {}
    const radarHeaders = ['sector', 'ring', 'oldRing', 'value']
    const radarIndexes = {}
    const headers = {}

    const headersRow = data.shift()
    let i = 0
    let radarParamHeaderIndex
    for (const header of headersRow) {
        if (radarHeaders.indexOf(header) !== -1) radarIndexes[i] = header
        if (paramHeaders.indexOf(header) !== -1) paramIndexes[i] = header
        if (radarHeaders.indexOf(header) === -1) headers[i] = header

        if (header === radarHeaders[0]) radarParamHeaderIndex = i
        i++
    }

    for (const row of data) {
        const isRadarParam = !row[radarParamHeaderIndex]
        if (isRadarParam) {
            const radarParam = {}
            for (const entry of Object.entries(paramIndexes)) {
                radarParam[entry[1]] = row[entry[0]]
            }
            if (radarParam.name === 'sheetId') { // Override radarId
                return radarParam.value;
            }
        }
    }

    return window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1)
}

async function save_blips() {
    const td = document.getElementById('publish-database');
    const oldText = td.innerText;
    td.innerText = 'Publishing...';

    const data = await loadEthercalc()

    const parsedData = parse_blips_data(data)
    const response = await save_raw_blips({
        blips: parsedData.blips,
    });
    await save_blip_links({
        links: parsedData.links,
        parameters: parsedData.parameters,
    });

    const json = await response.json()
    if (json.version) {
        td.innerText = `Publish (v${json.version} > v${json.version + 1})`;
    } else {
        td.innerText = oldText;
    }
}

function parse_blips_data(data) {
    const paramHeaders = ['name', 'value']
    const paramIndexes = {}
    const radarHeaders = ['sector', 'ring', 'oldRing', 'value']
    const radarIndexes = {}
    const headers = {}

    const headersRow = data.shift()
    let i = 0
    let radarParamHeaderIndex
    for (const header of headersRow) {
        if (radarHeaders.indexOf(header) !== -1) radarIndexes[i] = header
        if (paramHeaders.indexOf(header) !== -1) paramIndexes[i] = header
        if (radarHeaders.indexOf(header) === -1) headers[i] = header

        if (header === radarHeaders[0]) radarParamHeaderIndex = i
        i++
    }

    const blips = []
    const links = []
    const parameters = []

    let rowIndex = 1
    for (const row of data) {
        rowIndex++
        const isRadarParam = !row[radarParamHeaderIndex]
        if (isRadarParam) {
            const radarParam = {}
            for (const entry of Object.entries(paramIndexes)) {
                radarParam[entry[1]] = row[entry[0]]
            }
            if (radarParam.name === 'sheetId') { // Override radarId
                radarId = radarParam.value
            }
            parameters.push(radarParam)
        } else {
            const blip = {}
            for (const i of Object.keys(headers)) {
                blip[headers[i]] = row[i]
            }
            blip.id = `${radarId}-${rowIndex}`
            blips.push(blip)

            const link = {}
            for (const entry of Object.entries(radarIndexes)) {
                link[entry[1]] = row[entry[0]]
            }
            link.blip = blip.id
            links.push(link)
        }
    }

    return {
        blips,
        links,
        parameters,
    }
}

async function save_raw_blips(data) {
    return await fetch(databaseUrl, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        //mode: 'no-cors',
        body: JSON.stringify(data),
    })
}

async function save_blip_links(data) {
    return await fetch(`${databaseUrl}/radar/${radarId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        //mode: 'no-cors',
        body: JSON.stringify(data),
    })
}

function add_publish_button(graphTab) {
    const td = document.createElement('td');
    td.setAttribute('id', 'publish-database');
    td.setAttribute('style', graphTab.getAttribute('style'));
    td.style.cursor = 'pointer';
    td.onclick = save_blips;
    td.innerText = `Publish (v${blipsVersion} > v${blipsVersion + 1})`;
    graphTab.parentElement.append(td);
}