"used strict";

//* Prototype

HTMLElement.prototype.appear = function () {
    if (this.isAppear) return;
    this.classList.add("appear")
    this.isAppear = true;
};

HTMLElement.prototype.disappear = function () {
    if (!this.isAppear) return;
    this.classList.remove("appear")
    this.isAppear = false;
};

HTMLElement.prototype.checkChildAppear = function () {
    for (const child of this.children) {
        const { top, bottom } = child.getBoundingClientRect();
        if (
            top >= - child.offsetHeight &&
            bottom < window.innerHeight + child.offsetHeight
        ) child.appear()
        else child.disappear()
    }
};

HTMLElement.prototype.getRelativeParent = function (parentElement) {
    let parentElement_ = this;
    while ((parentElement_.parentElement) !== parentElement) parentElement_ = parentElement_.parentElement;
    return parentElement_
};

//* Const

const menu = document.querySelector("menu"),
    main = document.querySelector("main"),
    appearEvent = new CustomEvent("appear"),
    disappearEvent = new CustomEvent("disappear"),
    id = [...main.querySelectorAll("[id]")].map(n => n.id),
    sections = Object.fromEntries([...main.querySelectorAll("[id]")].map(section => {

        section.url = `#${section.id}`;
        section.parentSection = section.getRelativeParent(main);
        section.linkElement = [...document.querySelectorAll(`[href="${section.url}"]`)];

        section.setViewport = () => {
            main.scroll(section.parentSection.offsetLeft, 0);
            main.style.height = `${section.parentSection.clientHeight}px`;
        };

        section.show = () => {
            section.setViewport();
            window.scroll(0, section.offsetTop);
            section.checkChildAppear();
            section.linkElement.forEach(el => el.appear());
        };

        section.hide = () => {
            section.disappear();
            section.linkElement.forEach(el => el.disappear());
            for (const child of section.children) child.disappear();
        };

        if (0 < section.linkElement.length) {
            const parentMenuElement = menu.querySelector(`[menuLink="${section.linkElement[0].parentElement.getAttribute("menu")}"]`);
            if (parentMenuElement) section.linkElement.push(parentMenuElement);
        }

        return [section.url, section]
    })),
    defaultUrl = main.firstElementChild.url;

var current = sections[main.firstElementChild.url];

//* Events

// Switch sections
window.addEventListener("hashchange", () => {
    if (window.location.hash === current.url) return;
    if (!(window.location.hash in sections)) window.location = defaultUrl;
    current.hide();
    (current = sections[window.location.hash]).show();
    if (window.scrollY < menu.offsetHeight) menu.appear(); // Avoid issue when go back
    else if (!menu.isAppear) window.scroll(0, window.scrollY + menu.offsetHeight)
});

// Prevent issues
window.addEventListener("resize", () => {
    menu.appear();
    current.setViewport();
    current.checkChildAppear();
});

// Hide topbar
window.addEventListener("wheel", ({ deltaY }) => {
    if (deltaY > 0) menu.disappear();
    else menu.appear();
    current.checkChildAppear();
});

// Check what's in viewport
window.addEventListener("scroll", () => current.checkChildAppear());

//* Html generation

// Create menu
for (let menuLink of document.querySelectorAll("[menuLink]")) {
    menuLink.menu = document.querySelector(`[menu=${menuLink.getAttribute("menuLink")}]`);
    menuLink.focusLeave = function ({ target }) {
        if (target === menuLink) return;
        menuLink.menu.classList.remove("focus");
        window.removeEventListener("mousemoove", menuLink.focusLeave);

    }
    menuLink.addEventListener("click", () => {
        menuLink.menu.classList.add("focus");
        window.addEventListener("click", menuLink.focusLeave)
    })
}

// Create search navigation
var search = document.querySelector("[menuLink='searchMenu']");
search.defaultHTML = search.menu.innerHTML;
// TODO Create a search function
search.addEventListener("input", () => {
    search.menu.innerHTML = search.defaultHTML;
    search.style.width = `${search.value.length}ch`
})

//* Setup

window.onload = () => {
    if (!(window.location.hash in sections)) window.location = defaultUrl;
    (current = sections[window.location.hash]).show();
}