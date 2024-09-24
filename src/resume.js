import {MAT, ResumePlayBack, bookmarks, popup} from "./API";

document.addEventListener('DOMContentLoaded', function () {
    logger.log('resume.js loaded');
    ResumePlayBack.loadResumeData().then((data) => {


    }).catch((error) => {
        console.error(error);
    });
});