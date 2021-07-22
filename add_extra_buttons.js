let intervalId

function add_extra_buttons() {
    const graphTab = document.querySelector('#SocialCalc-graphtab')
    if (graphTab && !graphTab.nextElementSibling) {
        // Page is ready, add buttons now :
        add_preview_button(graphTab) // Add "Preview" button
        add_publish_button(graphTab) // Add "Publish" button

        clearInterval(intervalId)
    }
}

if (databaseUrl !== undefined) {
	if (window.location.pathname !== '/' && window.location.pathname !== '/_start') {
		window.addEventListener('load', function () {
			intervalId = setInterval(add_extra_buttons, 500)
		})
	}
}