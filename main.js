// ==UserScript==
// @name OpenCheck
// @version 1.0.0
// @description Adds verified OpenCheck information to Twitter profiles and threads
// @updateUrl TODO
// @icon TODO
// @include https://twitter.com/*
// ==/UserScript/

const baseUrl = "https://opencheck.is/"

/*
 * Icons for different services in SVG format.
 * Embedded to simplify usage as a userscript.
 */
const images = {
    "twitters": `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 310 310" style="enable-background:new 0 0 310 310;" xml:space="preserve">
<g id="XMLID_826_">
	<path id="XMLID_827_" d="M302.973,57.388c-4.87,2.16-9.877,3.983-14.993,5.463c6.057-6.85,10.675-14.91,13.494-23.73
		c0.632-1.977-0.023-4.141-1.648-5.434c-1.623-1.294-3.878-1.449-5.665-0.39c-10.865,6.444-22.587,11.075-34.878,13.783
		c-12.381-12.098-29.197-18.983-46.581-18.983c-36.695,0-66.549,29.853-66.549,66.547c0,2.89,0.183,5.764,0.545,8.598
		C101.163,99.244,58.83,76.863,29.76,41.204c-1.036-1.271-2.632-1.956-4.266-1.825c-1.635,0.128-3.104,1.05-3.93,2.467
		c-5.896,10.117-9.013,21.688-9.013,33.461c0,16.035,5.725,31.249,15.838,43.137c-3.075-1.065-6.059-2.396-8.907-3.977
		c-1.529-0.851-3.395-0.838-4.914,0.033c-1.52,0.871-2.473,2.473-2.513,4.224c-0.007,0.295-0.007,0.59-0.007,0.889
		c0,23.935,12.882,45.484,32.577,57.229c-1.692-0.169-3.383-0.414-5.063-0.735c-1.732-0.331-3.513,0.276-4.681,1.597
		c-1.17,1.32-1.557,3.16-1.018,4.84c7.29,22.76,26.059,39.501,48.749,44.605c-18.819,11.787-40.34,17.961-62.932,17.961
		c-4.714,0-9.455-0.277-14.095-0.826c-2.305-0.274-4.509,1.087-5.294,3.279c-0.785,2.193,0.047,4.638,2.008,5.895
		c29.023,18.609,62.582,28.445,97.047,28.445c67.754,0,110.139-31.95,133.764-58.753c29.46-33.421,46.356-77.658,46.356-121.367
		c0-1.826-0.028-3.67-0.084-5.508c11.623-8.757,21.63-19.355,29.773-31.536c1.237-1.85,1.103-4.295-0.33-5.998
		C307.394,57.037,305.009,56.486,302.973,57.388z"/>
</g>
</svg>
`,


    "twitter": `
<svg width="24px" height="24px" viewBox="-2 -4 24 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-twitter"><path d='M20 1.907a8.292 8.292 0 0 1-2.356.637A4.07 4.07 0 0 0 19.448.31a8.349 8.349 0 0 1-2.607.98A4.12 4.12 0 0 0 13.846.015c-2.266 0-4.103 1.81-4.103 4.04 0 .316.036.625.106.92A11.708 11.708 0 0 1 1.393.754a3.964 3.964 0 0 0-.554 2.03c0 1.403.724 2.64 1.824 3.363A4.151 4.151 0 0 1 .805 5.64v.05c0 1.958 1.415 3.591 3.29 3.963a4.216 4.216 0 0 1-1.08.141c-.265 0-.522-.025-.773-.075a4.098 4.098 0 0 0 3.832 2.807 8.312 8.312 0 0 1-5.095 1.727c-.332 0-.658-.02-.979-.056a11.727 11.727 0 0 0 6.289 1.818c7.547 0 11.673-6.157 11.673-11.496l-.014-.523A8.126 8.126 0 0 0 20 1.907z' /></svg>
`, // https://www.svgrepo.com/svg/360875/twitter
    
    "mastodon": `
<svg width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 15.9375 4.03125 C 12.917 4.0435 9.9179219 4.4269844 8.3574219 5.1464844 C 8.3574219 5.1464844 5 6.6748594 5 11.880859 C 5 18.077859 4.9955 25.860234 10.5625 27.365234 C 12.6945 27.938234 14.527953 28.061562 16.001953 27.976562 C 18.676953 27.825562 20 27.005859 20 27.005859 L 19.910156 25.029297 C 19.910156 25.029297 18.176297 25.640313 16.029297 25.570312 C 13.902297 25.495313 11.6615 25.335688 11.3125 22.679688 C 11.2805 22.432688 11.264625 22.182594 11.265625 21.933594 C 15.772625 23.052594 19.615828 22.420969 20.673828 22.292969 C 23.627828 21.933969 26.199344 20.081672 26.527344 18.388672 C 27.041344 15.720672 26.998047 11.880859 26.998047 11.880859 C 26.998047 6.6748594 23.646484 5.1464844 23.646484 5.1464844 C 22.000984 4.3779844 18.958 4.019 15.9375 4.03125 z M 12.705078 8.0019531 C 13.739953 8.0297031 14.762578 8.4927031 15.392578 9.4707031 L 16.001953 10.505859 L 16.609375 9.4707031 C 17.874375 7.5037031 20.709594 7.6264375 22.058594 9.1484375 C 23.302594 10.596438 23.025391 11.531 23.025391 18 L 23.025391 18.001953 L 20.578125 18.001953 L 20.578125 12.373047 C 20.578125 9.7380469 17.21875 9.6362812 17.21875 12.738281 L 17.21875 16 L 14.787109 16 L 14.787109 12.738281 C 14.787109 9.6362812 11.429688 9.7360938 11.429688 12.371094 L 11.429688 18 L 8.9765625 18 C 8.9765625 11.526 8.7043594 10.585438 9.9433594 9.1484375 C 10.622859 8.3824375 11.670203 7.9742031 12.705078 8.0019531 z"/></svg>
`,
    
    "orcid": `
<svg width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 16 3 C 8.8321388 3 3 8.832144 3 16 C 3 23.167856 8.8321388 29 16 29 C 23.167861 29 29 23.167856 29 16 C 29 8.832144 23.167861 3 16 3 z M 16 5 C 22.086982 5 27 9.9130223 27 16 C 27 22.086978 22.086982 27 16 27 C 9.9130183 27 5 22.086978 5 16 C 5 9.9130223 9.9130183 5 16 5 z M 11 8 A 1 1 0 0 0 11 10 A 1 1 0 0 0 11 8 z M 10 11 L 10 22 L 12 22 L 12 11 L 10 11 z M 14 11 L 14 12 L 14 22 L 18.5 22 C 21.525577 22 24 19.525577 24 16.5 C 24 13.474423 21.525577 11 18.5 11 L 14 11 z M 16 13 L 18.5 13 C 20.444423 13 22 14.555577 22 16.5 C 22 18.444423 20.444423 20 18.5 20 L 16 20 L 16 13 z"/></svg>
`,

    "unknown": `

`
}

/*
 * Fetch verification information about a user from the OpenCheck API
 *
 * Returns a JSON object in the form of:
 * {
 *   "status": "verified",
 *   "identities": [
 *     {
 *       "provider": "mastodon"
 *       "username": "@person@example.com"
 *       "url": 
 *     }
 *   ]
 * }
 */
async function fetchUserInfo(user) {
    let response = await fetch(baseUrl + "v1/identity/twitter/" + user)
    let json = response.json()
    return json
}

async function fetchUsersInfo(users) {
    let response = await fetch(baseUrl + "v1/identity/twitter?ids=" + users.join(','))
    let json = response.json()
    return json
}

/*
 * Find the element that displays the user's display name and username
 */
function getUserElement(user) {
    for (let div of document.querySelectorAll("[data-testid]")) {
        if (div.getAttribute("data-testid") == "UserName") {
            return div
        }
    }
    console.log("UserName element not found")
}

function getProfileElement() {
    return document.querySelectorAll(".css-1dbjc4n.r-le4sbl.r-thmkab.r-19urhcx")[0]
}

/* 
 * Extract a profile's username
 */
function getUserName() {
    /*
     * The query has four matches:
     * 0. The parent element for the display name
     * 1. The element for the display name
     * 2. The parent element for the username
     * 3. The element for the username
     * We want the last one.
     */
    return getUserElement()
        .querySelectorAll(".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0")[3]
        .innerText
        .substring(1) // remove the leading @ symbol
}

function getProfileNameEl() {
    return getUserElement()
        .querySelectorAll(".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0")[0]
        .firstChild
}

function generateProfileHTMLOld(user, identities) {
    let verify_box = document.createElement("div")
    verify_box.id = "opencheck-bio"
    verify_box.style.fontFamily = "TwitterChirp, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    verify_box.style.marginTop = "15px"
    verify_box.className = user
    
    let badges = document.createElement("div")
    badges.id = "opencheck-badges"
    badges.style.marginTop = "5px"
    
    for (let identity of identities) {
        if (identity["provider"] == "twitter"
            && identity["username"].toLowerCase() == user.toLowerCase()) {
            continue;
        }

        let parent = document.createElement("p")
        parent.style.margin = "0"

        let el = document.createElement("a")
        parent.innerText = "✅ " + identity["provider_name"] + ": "
        el.innerText = identity["username"]

        if (identity["url"] !== null) {
            el.href = identity["url"]
        }

        el.style.color = "rgb(29, 155, 240)"
        el.style.textDecoration = "none"
        
        parent.appendChild(el)

        badges.appendChild(parent)
    }

    if (badges.children.length != 0) {
        verify_box.appendChild(badges)
        return verify_box
    } else {
        return null
    }
}

/*
 * Generates the HTML to inject into a profile.
 */
function generateProfileHTML(user, identities) {
    let box = document.createElement("div")
    box.id = "opencheck-bio"
    box.className = user
    box.style.padding = "0"
    box.style.display = "inline-block"
    box.style.cssFloat = "left"

    let badges = []
    for (let identity of identities) {
        const provider = identity["provider"]

        if (provider == "twitter"
            && identity["username"].toLowerCase()  == user.toLowerCase()) {
            continue
        }

        let parent = {}
        if (identity["url"] !== null) {
            parent = document.createElement("a")
            parent.href = identity["url"]
            parent.title = identity["provider_display_name"]
        } else {
            parent = document.createElement("button")
        }
        parent.style.textDecoration = "none"
        parent.style.backgroundColor = "black"
        parent.style.border = "0"
        parent.style.borderRadius = "10px"
        parent.style.height = "40px"
        parent.style.width = "40px"
        parent.style.display = "inline-block"
        parent.style.margin = "0px 2px"
        parent.style.transitionDuration = "500ms"

        parent.addEventListener("mouseover", function () {
            parent.style.backgroundColor = "rgb(39, 44, 48)"
        })

        parent.addEventListener("mousedown", function () {
            parent.style.backgroundColor = "rgb(63, 67, 71)"
        })

        parent.addEventListener("mouseleave", function () {
            parent.style.backgroundColor = "black"
        })

        if (images[provider]) {
            parent.innerHTML = images[provider]
        } else {
            parent.innerHTML = images["unknown"]
        }
        let child = parent.querySelector("svg")
        child.setAttribute("width", "34px")
        child.setAttribute("height", "34px")
        child.style.marginTop = "3px"
        child.style.filter = "invert(100%)"
        child.style.marginLeft = "3px"

        badges.push(parent)
    }

    if (badges.length != 0) {
        for (let badge of badges) {
            box.appendChild(badge)
        }
        return box
    } else {
        return null
    }
}

function generateCheck(link) {
    let check = document.createElement('a')
    check.className = "opencheck-check"
    check.innerText += "✅"
    check.style.textDecoration = "none"
    check.style.display = "inline-block"
    check.style.marginLeft = "3px"
    check.href = link
    check.title = "Verified by OpenCheck"
    check.target = "_blank"
    return check
}

/*
 * User data in the form of:
 * {
 *   "jack": {
 *     "last_updated": 1668016383516,
 *     "data": {
 *       // data returned from the API
 *     }
 *   }
 * }
 */
let user_data = {}

/*
 * Insert the OpenCheck data into the profile for verified users.
 * Returns early if the profile is already generted or the user is unverified.
 */
async function injectProfile(user) {
    let data = {}
    if (Object.keys(user_data).includes(user)) {
        data = user_data[user].data
    } else {
        data = await fetchUserInfo(user)
        user_data[user] = {
            "last_updated": Date.now(),
            "data": data
        }
    }

    let prev = document.getElementById("opencheck-bio")
    if (prev) {
        if (prev.className == user) {
            return
        } else {
            prev.remove()
        }
    }

    if (data["status"] != "verified") {
        return
    }
    
    const name_el = getProfileNameEl()
    name_el.appendChild(generateCheck(data["url"]))

    const verify_box = generateProfileHTML(user, data["identities"])

    if (verify_box) {
        let target = document.querySelector(".css-1dbjc4n.r-1habvwh.r-18u37iz.r-1w6e6rj.r-1wtj0ep")
        let follow_button = target.querySelector(".css-1dbjc4n.r-obd0qt.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-dnmrzs")
        target.insertBefore(verify_box, follow_button)        
    }
}

/*
 * Injects a checkmark on verified accounts on any post feed.
 * This includes timelines, search results, and threads.
 */
function injectChecks() {
    let postEls = document.querySelectorAll(".css-1dbjc4n.r-eqz5dr.r-16y2uox.r-1wbh5a2")
    let usernameEls = getUsersElementsInThread()

    let users = []
    for (let el of usernameEls) {
        let username = el.lastChild.querySelector(".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0").innerText.substring(1)
        if (!users.includes(username) && !user_data["username"]) {
            users.push(username)
        }
    }

    users = users.filter((user) => !Object.keys(user_data).includes(user))

    if (users.length != 0) {
        fetchUsersInfo(users).then(function (data) {
            let now = Date.now()
            for (let user of users) {
                user_data[user] = {
                    "data": data[user],
                    "last_updated": now
                }
            }
        })
    }

    for (let el of usernameEls) {
        let dn_parent = el.querySelector(".css-1dbjc4n.r-1wbh5a2.r-dnmrzs")
        let display_name = el.querySelector(".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0")
        let username = el.lastChild.querySelector(".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0").innerText.substring(1)
        if (!dn_parent.querySelector(".opencheck-check")
            && Object.keys(user_data).includes(username)
            && user_data[username].data.status == "verified") {
            let link = user_data[username].data.url
            dn_parent.appendChild(generateCheck(link))
        }
    }
}

function getUsersElementsInThread() {
    let els = []
    for (let div of document.querySelectorAll("[data-testid]")) {
        if (div.getAttribute("data-testid") == "User-Names") {
            els.push(div)
        }
    }
    return els
}

const profile_selector = ".css-1dbjc4n.r-le4sbl.r-thmkab.r-19urhcx"
const thread_selector = ".css-1dbjc4n.r-eqz5dr.r-16y2uox.r-1wbh5a2"

setInterval(function () {
    injectChecks()

    if (document.querySelector(profile_selector)) {
        injectProfile(getUserName())
    }
}, 250)
