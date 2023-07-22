
function projectMenuMouseDown() {
    let menuContainer = document.getElementById("hideable-project-menu-content-container");
    if (!menuContainer)
        return;

    menuContainer.classList.toggle('hidden');
}

let projectMenuButton = document.getElementById("project-menu-div");
if (projectMenuButton) {
    projectMenuButton.addEventListener('mousedown', projectMenuMouseDown);
}