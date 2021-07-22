const graphingUrl = document.currentScript.getAttribute('data-url')

function add_preview_button(graphTab) {
    const td = document.createElement('td');
    td.setAttribute('id', 'preview-radar');
    td.setAttribute('style', graphTab.getAttribute('style'));
    td.style.cursor = 'pointer';
    td.onclick = function() {
        window.open(`${graphingUrl}/?sheetId=${window.location.href}.csv`, '_blank').focus()
    };
    td.innerText = 'Preview';
    graphTab.parentElement.append(td);
}