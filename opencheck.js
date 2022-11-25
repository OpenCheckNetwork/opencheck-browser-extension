// ==UserScript==
// @name OpenCheck
// @version 1.0.0
// @description Adds verified OpenCheck information to Twitter profiles and threads
// @updateUrl TODO
// @icon TODO
// @include https://twitter.com/*
// ==/UserScript/

const baseUrl = "https://api.opencheck.is/"

/*
 * Selectors for verious injection and extraction sites. Selected in order.
 * Specific classes should only be referenced here.
 */
const selectors = {
    /*
     * The element containing profile information (begins below the header image)
     */
    "profile": [
        ".css-1dbjc4n.r-1ifxtd0.r-ymttw5.r-ttdzmv",
        ".css-1dbjc4n.r-le4sbl.r-thmkab.r-19urhcx"
    ],

    /*
     * A child of "profile" containing the display name of the account.
     * The profile check is appended to this element.
     */
    "profile_name": [
        ".css-901oao.r-1awozwy.r-18jsvk2.r-6koalj.r-37j5jr.r-evnaw.r-1vr29t4.r-eaezby.r-bcqeeo.r-1udh08x.r-qvutc0",
        ".css-901oao.r-1awozwy.r-18jsvk2.r-6koalj.r-37j5jr.r-adyw6z.r-1vr29t4.r-135wba7.r-bcqeeo.r-1udh08x.r-qvutc0",
        // Dark mode
        ".css-901oao.r-1awozwy.r-1nao33i.r-6koalj.r-37j5jr.r-adyw6z.r-1vr29t4.r-135wba7.r-bcqeeo.r-1udh08x.r-qvutc0",
        // Dim mode
        ".css-901oao.r-1awozwy.r-vlxjld.r-6koalj.r-37j5jr.r-adyw6z.r-1vr29t4.r-135wba7.r-bcqeeo.r-1udh08x.r-qvutc0"
    ],

    /*
     * This selector has four matches:
     * 0. The parent element for the display name
     * 1. The element for the display name
     * 2. The parent element for the username
     * 3. The element for the username
     * This is a child of the element with a test-id of "UserName"
     */
    "profile_username": [".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"],

    /*
     * The second element of this query is the parent element for the display name on a profile.
     */
    "fixed_name": [".css-1dbjc4n.r-1awozwy.r-xoduu5.r-18u37iz.r-dnmrzs"],

    /*
     * The HoverCard elements that contain display names and usernames
     */
    "hovercard_names": [".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"],

    /*
     * The target element for injecting a check into a hovercard.
     * Sub-element of the HoverCard.
     */
    "hovercard_target": [".css-1dbjc4n.r-1awozwy.r-18u37iz.r-dnmrzs"],

    /*
     * The elements for the display and user names of quoted tweets in a thread.
     */
    "quotetweet_names": [
        ".css-1dbjc4n.r-1ets6dv.r-1867qdf.r-rs99b7.r-1loqt21.r-1ny4l3l.r-1udh08x.r-o7ynqc.r-6416eg"
    ],
    "quotetweet_username": [".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"],
    "quotetweet_target_parent": [".css-1dbjc4n.r-1wbh5a2.r-dnmrzs"],
    "quotetweet_target": [".css-1dbjc4n.r-1awozwy.r-18u37iz.r-dnmrzs"],

    /*
     * The elements for posts in a thread.
     */
    "posts": [".css-1dbjc4n.r-eqz5dr.r-16y2uox.r-1wbh5a2"],
    "post_username": [".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"],
    "post_displayname_parent": [".css-1dbjc4n.r-1wbh5a2.r-dnmrzs"],

    /*
     * The name elements in a UserCell (such as in search results and suggestions)
     * Child of a UserCell or TypeaheadUser
     */
    "usercell_names": [".css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0"],
    "usercell_target": [".css-1dbjc4n.r-1awozwy.r-18u37iz.r-dnmrzs"]
}

/*
 * Queries the page for a certain selector one-by-one, returning the first
 * existing element. Necessary because Twitter can return different HTML for
 * different clients.
 * If `check` is false, hard fail by printing an error to the console.
 * If `index` is less than 0, return all elements found
 */
function findElement(parent, sels, index = 0, check = false) {
    for (let selector of sels) {
        if (!parent) {
            break
        }
        let els = parent.querySelectorAll(selector)

        if (els.length != 0) {
            if (index >= 0) {
                let el = els[index]
                if (el) {
                    return el
                } else {
                    continue
                }
            } else {
                return els
            }
        }
    }
    if (!check) {
        console.error("OpenCheck: Failed to find element from selectors: ", sels)
    }
    if (index >= 0) {
        return null
    } else {
        return []
    }
}

function findElementFromSelector(parent, id, index = 0, check = false) {
    return findElement(parent, selectors[id], index, check)
}

/*
 * Custom fetch function that throws an error for invalid response codes and
 * integrates with the API directly
 */
async function customFetch(endpoint, opts = {}) {
    let res = fetch(baseUrl + endpoint)
        .then(res => {
            if (!res.ok) {
                throw "Invalid response: " + res.status
            } else {
                return res
            }
        })
        .catch(async (e) => {
            throw e
        })

    return res
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
    try {
        let response = await customFetch("v1/identity/twitter/" + user)
        let json = response.json()
        return json
    } catch (e) {
        return {}
    }
}

async function fetchUsersInfo(users) {
    try {
        let response = await customFetch("v1/identity/twitter?ids=" + users.join(','))
        let json = response.json()
        return json
    } catch (e) {
        return {}
    }
}

async function fetchProfileHTML(user) {
    let response = await customFetch("v1/identity/twitter/" + user + "/html")
    let html = await response.text()
    return html
}

function generateCheck(link) {
    let check = document.createElement('a')
    check.className = "opencheck-check"
    check.innerText += "✅"
    check.href = link
    check.title = "Verified by OpenCheck"
    check.target = "_blank"
    return check
}

/*
 * Find the element that displays the user's display name and username
 */
function getUserElement(user) {
    let els = getElementsByTestId("UserName")
    if (els.length == 0) {
        console.error("UserName element not found")
    } else {
        return els[0]
    }
}

function getProfileElement(check = false) {
    return findElement(document, selectors["profile"], 0, check)
}

/* 
 * Extract a profile's username
 */
function getUserName() {
    return findElement(getUserElement(), selectors["profile_username"], 3, false)
        .innerText
        .substring(1) // remove the leading @ symbol
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
        box.style.left =
            (check_el.clientWidth / 2 + check_el.offsetLeft - box.clientWidth / 2 + 25)
            + "px"
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

    if (!data || data["status"] != "verified") {
        return
    }

    const name_el = findElement(getUserElement(), selectors["profile_name"])

    let check = generateCheck(data["url"])
    check.id = "opencheck-profile-check"
    check.innerText += " OpenCheck"
    name_el.appendChild(check)

    let box = document.createElement("div")
    box.id = "opencheck-ids"
    box.className = user
    box.innerHTML = await getProfileHTML(user)

    getProfileElement().appendChild(box)

    // Append check to fixed display name
    let fixed_name = findElement(document, selectors["fixed_name"], -1)[1]

    if (!fixed_name.querySelector(".opencheck-check")) {
        let fixed_check = generateCheck(data["url"])
        fixed_check.style.fontSize = "18px"
        fixed_name.appendChild(fixed_check)
    }

    showOrHideBox()
    resizeBox()

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

async function injectQuoteTweetChecks() {
    let els = findElement(document, selectors["quotetweet_names"], -1, true)

    for (let el of els) {
        let username = findElement(el, selectors["quotetweet_username"], 2)
            .innerText.substring(1)

        getUserInfo(username).then(data => {
            if (data != undefined && data.status == "verified") {
                let check = generateCheck(data.url)
                let parent = findElement(el, selectors["quotetweet_target_parent"], 2)
                let target = findElement(parent, selectors["quotetweet_target"])

                if (!target.querySelector(".opencheck-check")) {
                    target.appendChild(check)
                }
            }
        })
    }
}

/*
 * Injects a checkmark on verified accounts on any post feed.
 * This includes timelines, search results, and threads.
 */
async function injectThreadChecks() {
    let postEls = findElement(document, selectors["post_username"])
    let usernameEls = getElementsByTestId("User-Names")
    injectQuoteTweetChecks()

    let users = []
    for (let el of usernameEls) {
        let username = findElement(el.lastChild, selectors["post_username"])
            .innerText.substring(1)

        if (!users.includes(username) && !user_data["username"]) {
            users.push(username)
        }
    }

    users = users.filter(user => !Object.keys(user_data).includes(user))

    if (users.length != 0) {
        let data = await fetchUsersInfo(users)
        let now = Date.now()
        for (let user of users) {
            user_data[user] = {
                "data": data[user],
                "last_updated": now
            }
        }
    }

    for (let el of usernameEls) {
        let dn_parent = findElement(el, selectors["post_displayname_parent"])
        let username = findElement(el.lastChild, selectors["post_username"])
            .innerText.substring(1)

        let data = await getUserInfo(username)
        if (!dn_parent.querySelector(".opencheck-check")
            && data && data.status == "verified") {
            dn_parent.appendChild(generateCheck(data["url"]))
        }
    }
}

/*
 * Filters elements to find one with a leading @ symbol. This should be the
 * username.
 */
function extractUserName(els) {
    for (let el of els) {
        if (el.innerText[0] === "@") {
            return el.innerText.substring(1)
        }
    }
}

async function appendCheckToElement(el) {
    let els = findElement(el, selectors["usercell_names"], -1, true)

    let username = extractUserName(els)
    if (!username) {
        return
    }

    let data = await getUserInfo(username)
    let check = generateCheck(data["url"])
    if (data && data.status == "verified") {
        let target = findElement(el, selectors["usercell_target"])
        if (!target.querySelector(".opencheck-check")) {
            target.appendChild(check)
        }
    }
}

/*
 * Injects a checkmark into search results, both on the search page and bar
 */
async function injectSearchResults() {
    // Search page
    for (let el of getElementsByTestId("UserCell")) {
        appendCheckToElement(el)
    }

    // Search bar
    for (let el of getElementsByTestId("TypeaheadUser")) {
        appendCheckToElement(el)
    }
}

/*
 * Injects a checkmark into verified profiles' hovercards
 * Returns early if no hover card is present or user is unverified
 */
async function injectHoverCard() {
    const card = getElementsByTestId("HoverCard")[0]
    if (!card || !card.firstChild) {
        return
    }
    let els = findElement(card.firstChild, selectors["hovercard_names"], -1)
    if (els === null) {
        return
    }

    let username = extractUserName(els)
    if (!username) {
        return
    }

    let data = await getUserInfo(username)

    if (!data || data.status != "verified") {
        return
    }

    let target = findElement(card, selectors["hovercard_target"])
    if (target && !target.querySelector(".opencheck-check")) {
        target.appendChild(generateCheck(data.url))
    }
}

function getElementsByTestId(id) {
    let els = []
    for (let div of document.querySelectorAll("[data-testid]")) {
        if (div.getAttribute("data-testid") == id) {
            els.push(div)
        }
    }
    return els
}

let style = document.createElement("style")
style.innerText = `
#opencheck-ids {
  position: absolute;
  display: none;
  background-color: white;
  border-radius: 15px;
  box-shadow: lightgray 0px 0px 10px 0px;
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

.opencheck-check {
  text-decoration: none;
  display: inline-block;
  margin-left: 3px;
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

let generating_hoverbox = false
let keep_going = true
let last_path = ""
setInterval(async function () {
    let path = window.location.pathname
    if (path != last_path) {
        last_path = path
        keep_going = true
    }

    if (!keep_going) {
        return
    }

    try {
        await injectThreadChecks()
        await injectHoverCard()
        await injectSearchResults()
        if (getProfileElement(true) && !generating_hoverbox) {
            generating_hoverbox = true
            await injectProfile(getUserName())
            generating_hoverbox = false
        }
    } catch(e) {
        console.error("OpenCheck: stopping because of error: ", e)
        keep_going = false
    }
}, 250)
