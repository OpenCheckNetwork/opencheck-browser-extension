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
        .querySelector(".css-901oao.r-1awozwy.r-18jsvk2.r-6koalj.r-37j5jr.r-evnaw.r-1vr29t4.r-eaezby.r-bcqeeo.r-1udh08x.r-qvutc0")
}

async function fetchProfileHTML(user) {
    let response = await fetch(baseUrl + "v1/identity/twitter/" + user + "/html")
/*        .then(res => {
            if (!res.ok) {
                throw new Error()
            }
            let html = response.text()
            return html
        })
        .catch(e => {
            throw new Error()
            })*/
    let html = await response.text()
    return html
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
 *     },
 *     "html": "HTML returned from the API"
 *   }
 * }
 */
let user_data = {}

/*
 * Returns information about a user from either the user_data store or the API.
 * Modifies user_data.
 */
async function getUserInfo(user) {
    if (Object.keys(user_data).includes(user)) {
        return user_data[user].data
    } else {
        data = await fetchUserInfo(user)
        user_data[user] = {
            "last_updated": Date.now(),
            "data": data
        }
        return data
    }
}

async function getProfileHTML(user) {
    if (user_data[user]["html"]) {
        return user_data[user].html
    } else {
        const html = await fetchProfileHTML(user)
        user_data[user].html = html
        return html
    }
}

function removeIfExists(query) {
    let el = document.querySelector(query)
    if (el) {
        el.remove()
    }
}

let mouseover_check = false
let mouseover_box = false

function showOrHideBox() {
    let box = document.querySelector("#opencheck-ids")
    if (mouseover_check || mouseover_box) {
        box.style.display = "block"

        // Because the box's client width only exists when it's displayed,
        // we have to set it here
        const check_el = document.querySelector("#opencheck-profile-check")
        let offset_left = check_el.offsetLeft
        box.style.left = (check_el.clientWidth / 2 + check_el.offsetLeft - box.clientWidth / 2 + 25) + "px"
    } else {
        box.style.display = "none"
    }
}

function resizeBox() {
    let box = document.querySelector("#opencheck-ids")
    let offset_top = getUserElement().offsetTop
    const check_el = document.querySelector("#opencheck-profile-check")
}

/*
 * Injects the OpenCheck profile data for verfied profiles
 * Returns early if profile data already is injected or the user is unverified.
 */
async function injectProfile(user) {
    let data = await getUserInfo(user)

    // If we've already injected for this user, return
    let old_el = document.querySelector("#opencheck-ids")
    if (old_el && old_el.className == user) {
        return
    }

    removeIfExists("#opencheck-profile-check")
    removeIfExists("#opencheck-ids")

    if (data["status"] != "verified") {
        return
    }

    const name_el = getProfileNameEl()

    let check = generateCheck(data["url"])
    check.id = "opencheck-profile-check"
    check.innerText += " OpenCheck"
    name_el.appendChild(check)

    let box = document.createElement("div")
    box.id = "opencheck-ids"
    box.className = user
    box.innerHTML = await getProfileHTML(user)

    getProfileElement().appendChild(box)

    showOrHideBox()
    resizeBox()

    console.log("Adding event listeners")

    window.addEventListener("resize", resizeBox)
    
    check.addEventListener("mouseover", () => {
        mouseover_check = true
        showOrHideBox()
    })

    check.addEventListener("mouseleave", () => {
        mouseover_check = false
        showOrHideBox()
    })

    box.addEventListener("mouseover", () => {
        mouseover_box = true
        showOrHideBox()
    })

    box.addEventListener("mouseleave", () => {
        mouseover_box = false
        showOrHideBox()
    })
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

    users = users.filter(user => !Object.keys(user_data).includes(user))

    if (users.length != 0) {
        fetchUsersInfo(users).then(data => {
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

let style = document.createElement("style")
style.innerText = `
#opencheck-ids {
  position: absolute;
  display: none;
  background-color: white;
  border-radius: 30px;
  box-shadow: lightgray 4px 4px 10px 4px;
  top: 110px;
  left: 70px;
  padding: 10px 20px;
  font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  animation: fadeIn 500ms;
}

.opencheck-hide {
  animation: fadeOut 500ms;
}

#opencheck-ids h4 {
  margin-bottom: 0;
  padding-bottom: 0;
}

#opencheck-ids ul {
  padding: 0;
  margin: 10px 20px 20px 20px;
}

#opencheck-ids a {
  color: rgb(29, 155, 240);
  text-decoration: none;
}

#opencheck-ids a:hover {
  text-decoration: underline;
}

#opencheck-profile-check {
  font-size: 0.8em;
  text-decoration: none;
  color: rgb(29, 155, 240);
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; display: block !important; }
}
`
document.head.appendChild(style)

setInterval(async function () {
    try {
        injectChecks()

        if (document.querySelector(profile_selector)) {
            injectProfile(getUserName())
        }
    } catch(e) {
        console.log("Sleeping")
        await new Promise(r => setTimeout(r, 2000));
    }
}, 250)
