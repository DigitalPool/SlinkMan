let myLinks = JSON.parse(localStorage.getItem("myLinks")) || {};
let darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;

renderCategories();
populateCategoryDropdown();

function saveLink(event) {
	event.preventDefault(); //to prevent the default action of the form
	const link = document.getElementById("input-el").value.trim();
	const info = document.getElementById("info-el").value.trim();
	const category = document.getElementById("category-select").value;

	if (!link) return alert("Please enter a valid link!");

	let fullLink;

	if (link.startsWith("http://") || link.startsWith("https://")) {
		fullLink = link;
	} else {
		fullLink = "http://" + link;
	}

	if (!myLinks[category]) myLinks[category] = [];
	myLinks[category].push({ link: fullLink, info });

	saveToLocalStorage();
	renderCategories();
	clearInputs();
}

document.getElementById("new-category").addEventListener("blur", function () {
	const newCategory = this.value.trim();
	if (newCategory && !myLinks[newCategory]) {
		myLinks[newCategory] = [];
		saveToLocalStorage();
		populateCategoryDropdown();
		renderCategories();
		alert(`Category "${newCategory}" added!`);
		this.value = "";
	}
});

function populateCategoryDropdown() {
	const dropdown = document.getElementById("category-select");
	dropdown.innerHTML = "";
	Object.keys(myLinks).forEach((category) => {
		const option = document.createElement("option");
		option.value = category;
		option.textContent = category;
		dropdown.appendChild(option);
	});
}

// function renderCategories() {
// 	const container = document.getElementById("category-container");
// 	container.innerHTML = "";

// 	Object.keys(myLinks).forEach((category) => {
// 		const categoryItem = document.createElement("li");
// 		categoryItem.classList.add("category-item");

// 		const title = document.createElement("div");
// 		title.textContent = category;
// 		title.style.fontWeight = "bold";
// 		title.style.cursor = "pointer";
// 		title.classList.add("expand-title");

// 		title.addEventListener("click", () => toggleLinks(categoryItem, category));

// 		const deleteBtn = document.createElement("button");
// 		deleteBtn.textContent = "Delete Category";
// 		deleteBtn.classList.add("delete-btn");
// 		deleteBtn.addEventListener("click", () => deleteCategory(category));

// 		const exportBtn = document.createElement("button");
// 		exportBtn.textContent = "Export";
// 		exportBtn.classList.add("export-btn");
// 		exportBtn.addEventListener("click", () => exportToExcel(category));

// 		categoryItem.appendChild(title);
// 		categoryItem.appendChild(deleteBtn);
// 		categoryItem.appendChild(exportBtn);
// 		container.appendChild(categoryItem);
// 	});
// }


function renderCategories() {
    const container = document.getElementById("category-container");
    container.innerHTML = "";

    Object.keys(myLinks).forEach((category) => {
        const categoryItem = document.createElement("li");
        categoryItem.classList.add("category-item");

        const title = document.createElement("div");
        title.textContent = category;
        title.classList.add("expand-title"); // gives the title a class to style later
        title.addEventListener("click", () => toggleLinks(categoryItem, category));

        // Create a container just for the buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const showBtn = document.createElement("button");
        showBtn.textContent = "Show";
        showBtn.classList.add("show-btn");
        showBtn.addEventListener("click", () => toggleLinks(categoryItem, category));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => deleteCategory(category));

        const exportBtn = document.createElement("button");
        exportBtn.textContent = "Export";
        exportBtn.classList.add("export-btn");
        exportBtn.addEventListener("click", () => exportToExcel(category));

        // Append the buttons to the button container
        buttonContainer.appendChild(showBtn);
        buttonContainer.appendChild(deleteBtn);
        buttonContainer.appendChild(exportBtn);

        // Append title and button container to the category item
        categoryItem.appendChild(title);
        categoryItem.appendChild(buttonContainer);

        container.appendChild(categoryItem);
    });
}


function toggleLinks(parent, category) {
	let linkContainer = parent.nextElementSibling;

	if (linkContainer && linkContainer.classList.contains("link-container")) {
		linkContainer.remove();
		return;
	}

	linkContainer = document.createElement("div");
	linkContainer.classList.add("link-container");

	if (myLinks[category].length === 0) {
		linkContainer.textContent = "No links available.";
	} else {
		myLinks[category].forEach(({ link, info }) => {
			const linkItem = document.createElement("div");
			linkItem.classList.add("link-item");

			const anchor = document.createElement("a");
			anchor.href = link;
			anchor.textContent = link;
			anchor.target = "_blank";
			anchor.style.fontSize = "0.7rem";
			anchor.style.display = "block";

			const infoText = document.createElement("div");
			infoText.textContent = info || "";
			infoText.style.fontSize = "0.6rem";
			infoText.style.color = "#666";
			infoText.style.marginTop = "0.2rem";
			infoText.style.marginBottom = "0.2rem";

			linkItem.appendChild(anchor);
			linkItem.appendChild(infoText);

			linkContainer.appendChild(linkItem);
		});
	}

	parent.parentNode.insertBefore(linkContainer, parent.nextSibling);
}

function deleteCategory(category) {
	if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
		delete myLinks[category];
		saveToLocalStorage();
		renderCategories();
		populateCategoryDropdown();
	}
}

function exportToExcel(category) {
	const data = myLinks[category].map(({ link, info }) => ({ Link: link, Info: info || "No info" }));
	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, category);
	XLSX.writeFile(workbook, `${category}-links.xlsx`);
}

function saveToLocalStorage() {
	localStorage.setItem("myLinks", JSON.stringify(myLinks));
}

function clearInputs() {
	document.getElementById("input-el").value = "";
	document.getElementById("info-el").value = "";
}

document.getElementById("dark-mode-toggle").addEventListener("click", () => {
	darkMode = !darkMode;
	document.body.classList.toggle("dark-mode", darkMode);
	localStorage.setItem("darkMode", JSON.stringify(darkMode));
});

if (darkMode) document.body.classList.add("dark-mode");

document.getElementById("save-btn").addEventListener("click", saveLink);

document.getElementById("add-tab-btn").addEventListener("click", () => {
	if (chrome?.tabs) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentTab = tabs[0];
			const currentUrl = currentTab.url;
			const category = document.getElementById("category-select").value;

			if (!myLinks[category]) myLinks[category] = [];
			myLinks[category].push({ link: currentUrl, info: "Added from current tab" });

			saveToLocalStorage();
			renderCategories();

			alert(`Link added to category: ${category}`);
		});
	} else {
		alert("Chrome Tabs API is not available.");
	}
});
