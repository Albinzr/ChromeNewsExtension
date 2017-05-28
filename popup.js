"use strict";

var offSet = 0;
var limit = 10;
var loadMoreStatus = false;
var fields = "headline,author-name,slug,published-at,hero-image-s3-key";
var baseURL = "https://www.thequint.com/api/v1/";
var imageCDN = "https://quintype-01.imgix.net/";
var searchKey = ""
var section = ""
var urlType = {
    latest: 'latest',
    section: 'section',
    search: 'search'
};
var currentUrlType = urlType.latest

// URLs
function getCurrentURL(key) {
    var urlFunction;
    switch (key) {
        case urlType.latest:
            return baseURL + getLatestNewsURL() + fields;
        case urlType.section:
            return baseURL + getSectionNewsURL() + section + "&" + fields;
        case urlType.search:
            return getSearchURl()
    }
}

function getSearchURl() {

    return baseURL + "search?=" + searchKey + "&offset=" + offSet + "&limit=" + limit
}

function getLatestNewsURL() {

    return "stories?offset=" + offSet + "&limit=" + limit + "&fields="
}

function getSectionNewsURL() {
    console.log("stories?offset=" + offSet + "&limit=" + limit + "&section=")
    return "stories?offset=" + offSet + "&limit=" + limit + "&section="
}
//End of URL

function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        callback(url);
    });
}
// Toggle Menu
function toggleCategoryList(event) {
    var list = document.getElementById("cat-list");
    var sl = document.getElementById("nav-icon2");
    var menuIcon = document.getElementById('nav-icon2');
    if (event.target == sl || event.target.toString() == '[object HTMLSpanElement]') {
        if (list.style.display == "none") {
            list.style.display = "block";
            sl.setAttribute("class", 'open')
        } else {
            list.style.display = "none";
            sl.removeAttribute("class");
        }
    } else {
        list.style.display = "none";
        sl.removeAttribute("class");
    }
}
// Get Menu
function getMenuItems(code, category) {
    var data = {};
    var xmlhttp = new XMLHttpRequest();
    var trackUrl = "https://www.thequint.com/api/v1/config";
    xmlhttp.onload = function() {
        if (xmlhttp.status == 200) {
            data = JSON.parse(xmlhttp.responseText);
            var menu = data.layout.menu;
            var categorieTag = document.getElementById("categories");
            categorieTag.innerHTML = "";
            for (var i = 0; i < menu.length; i++) {
                var li = document.createElement("li");
                li.addEventListener("click", toggleCategoryList);
                var u = document.createElement("a");
                u.setAttribute("id", "menu-button");
                u.addEventListener("click", loadSection);
                u.innerHTML = menu[i]["section-name"];
                u.setAttribute("data-section", menu[i]["section-name"]);
                if (u.innerHTML != "") {
                    li.appendChild(u);
                    categorieTag.append(li);
                }
            }
        } else if (xmlhttp.status == 503) {
            setServiceUnavailable();
        }
    };
    xmlhttp.open("GET", trackUrl, true);
    xmlhttp.send(null);
}
//initial story loader
function getStories(autoLoad) {
    // debugger
    var stories = ""
    offSet = 0;
    var data = {};
    var xmlhttp = new XMLHttpRequest();
    var trackUrl = getCurrentURL(currentUrlType);
    xmlhttp.onload = function() {
        if (xmlhttp.status == 200) {

            console.log(xmlhttp)
            data = JSON.parse(xmlhttp.responseText);
            if (Object.keys(data).length < limit) {
                loadMoreStatus = false
            }
            if (autoLoad) {

            }
            console.log(data, "initial")
            loadMoreStatus = true;
            if (currentUrlType == urlType.search) {
                stories = data.results.stories
            } else {
                stories = data.stories;
            }

            var storiesTag = document.getElementById("stories");
            var scrollTag = document.getElementById("scroll-point");
            scrollTag.removeEventListener("scroll", scrollReachedBottom, true);
            scrollTag.addEventListener("scroll", scrollReachedBottom, true);
            storiesTag.innerHTML = "";
            // if (currentUrlType == urlType.latest) {
            debugger
            storyParser(stories);
            // }

        } else if (xmlhttp.status == 503) {
            setServiceUnavailable();
        }
    };
    xmlhttp.open("GET", trackUrl, true);
    console.log(trackUrl);
    xmlhttp.send(null);
    var storiesTag = document.getElementById("scroll-point");
    scrollTo(storiesTag, 0, 50);
}
// Error Handler
function setServiceUnavailable() {
    var er = document.getElementById("error");
    if (er) {
        // document.getElementById('er-img').src = 'images/error.gif';
        er.style.display = "block";
    }
}
// Go to story
function showCompleteStory(event) {
    chrome.tabs.create({
        url: baseURL + event.target.closest("li").getAttribute("data-slug")
    });
}
// Load Section
function loadSection() {
    offSet = 0;
    // var storiesTag = document.getElementById("scroll-point");
    // scrollTo(storiesTag, 0, 4);
    var sectionTag = event.target.getAttribute("data-section");
    section = sectionTag
    currentUrlType = urlType.section
    getStories();
}
// global click event creator
function createClickEvents() {
    //togglebuttom
    var toggleButton = document.getElementById("nav-icon2");
    toggleButton.addEventListener("click", toggleCategoryList);
    // search button
    var searchButton = document.getElementById("search-button");
    searchButton.addEventListener("click", search);
    // search toggle
    var searchToggleButton = document.getElementById("nav-search-button");
    searchToggleButton.addEventListener("click", toggleSearch);

}
//toggel search
function toggleSearch(){
    var searchToggleButton = document.getElementById("search-continer");
     if (searchToggleButton.style.display == "none") {
            searchToggleButton.style.display = "block";
            // sl.setAttribute("class", 'block')
        } else {
            searchToggleButton.style.display = "none";
            // sl.removeAttribute("class");
        }   
}
//search call
function search() {
    var searchText = document.getElementById("search-text").value
    searchKey = searchText
    currentUrlType = urlType.search
    getStories()
}
// Detect scroll to last element
function scrollReachedBottom(o) {
    if (o.target.offsetHeight + o.target.scrollTop == o.target.scrollHeight) {
        if (loadMoreStatus) {
            offSet = offSet + 10;
            loadMore(getCurrentURL(currentUrlType))
        }
    }
}
// Load more story on scroll
function loadMore(currentURL) {
    var data = {};
    var stories = ""
    var xmlhttp = new XMLHttpRequest();
    var trackUrl = currentURL;

    xmlhttp.onload = function() {
        if (xmlhttp.status == 200) {
            data = JSON.parse(xmlhttp.responseText);
            if (Object.keys(data).length < limit) {
                loadMoreStatus = false
            }
            console.log(data, "load more");
            loadMoreStatus = true;
            var stories = data.stories;
            if (currentUrlType == urlType.search) {
                stories = data.results.stories
            } else {
                stories = data.stories;
            }

            storyParser(stories);
        } else if (xmlhttp.status == 503) {
            setServiceUnavailable();
        }
    };
    xmlhttp.open("GET", trackUrl, true);
    xmlhttp.send(null);
}
//Story parser
function storyParser(stories) {


    var storiesTag = document.getElementById("stories");
    for (var i = 0; i < stories.length; i++) {
        var t = new Date(stories[i]["published-at"]);
        var date = t.getDate() + "/" + (t.getMonth() + 1) + "/" + t.getFullYear();

        var headline = stories[i]["headline"];
        var author = stories[i]["author-name"];
        var slug = stories[i]["slug"];
        var image = stories[i]["hero-image-s3-key"];
        var listTag = document.createElement("li");
        listTag.addEventListener("click", showCompleteStory);
        listTag.setAttribute("data-slug", slug);
        storiesTag.append(listTag);
        var imageContainer = document.createElement("div");
        // Image Section
        imageContainer.classList.add("story-image");
        var imageTag = document.createElement("img");
        imageTag.src = imageCDN + image + "?w=150";
        imageTag.alt = name;
        imageContainer.append(imageTag);
        listTag.append(imageContainer);
        // Text Section
        var storyInfoContainer = document.createElement("div");
        storyInfoContainer.classList.add("story-info");

        var paraTag = document.createElement("p");
        paraTag.classList.add("heading-info");
        storyInfoContainer.append(paraTag);
        paraTag.innerHTML = headline;

        var paraTag = document.createElement("p");
        storyInfoContainer.append(paraTag);

        var spanTag = document.createElement("span");
        spanTag.classList.add("story-author");
        paraTag.append(spanTag);
        spanTag.innerHTML = "Author: " + author;

        var spanTag = document.createElement("span");
        spanTag.classList.add("story-seprator");
        paraTag.append(spanTag);
        spanTag.innerHTML = " | ";

        var spanTag = document.createElement("span");
        spanTag.classList.add("story-date");
        paraTag.append(spanTag);
        spanTag.innerHTML = "Date: " + date;

        listTag.append(storyInfoContainer);

        var hrTag = document.createElement("hr");
        storiesTag.append(hrTag);
    }
}
// Scroll to
function scrollTo(element, to, duration) {
    if (duration < 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 2;

    setTimeout(function() {
        element.scrollTop = element.scrollTop + perTick;
        scrollTo(element, to, duration - 2);
    }, 10);
}
// Main  - On load calls
document.addEventListener("DOMContentLoaded", function() {
    createClickEvents();
    getStories(baseURL + getLatestNewsURL() + fields);
    getMenuItems();
});
// Auto reload
setInterval(function() {

    getStories(true)
}, 300000);
