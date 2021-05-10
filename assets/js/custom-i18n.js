const langContainerClass = "i18n-container";
const langSwitchClass = "i18n-switch";

const langMarkerClassPrefix = "i18n-lang__"

const langLocalStorageName = "i18n-lang";
const defaultLangCode = "en";

const activeLangColor = "#ff7601";

function setCurrentLang(lang) {
    window.localStorage.setItem(langLocalStorageName, lang);
    updateLangContainers();
}
function getCurrentLang() {
    return window.localStorage.getItem(langLocalStorageName);
}

function updateLangContainers() {
    const lang = getCurrentLang() || defaultLangCode;

    const containers = document.getElementsByClassName(langContainerClass);
    Array.from(containers).forEach((el) => {
        if (el.classList.contains(langMarkerClassPrefix + lang)) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });

    const switchOptions = document.getElementsByClassName(langSwitchClass);
    Array.from(switchOptions).forEach((el) => {
        if (el.classList.contains(langMarkerClassPrefix + lang)) {
            el.style.color = activeLangColor;
        } else {
            el.style.color = null;
        }
    });
}

document.addEventListener("DOMContentLoaded", updateLangContainers);
