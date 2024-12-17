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

function renderCategories() {
	const container = document.getElementById("category-container");
	container.innerHTML = "";

	Object.keys(myLinks).forEach((category) => {
		const categoryItem = document.createElement("li");
		categoryItem.classList.add("category-item");

		const title = document.createElement("div");
		title.textContent = category;
		title.classList.add("expand-title");
		title.addEventListener("click", () => toggleLinks(categoryItem, category));

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
		myLinks[category].forEach(({ link, info }, index) => {
			const linkItem = document.createElement("div");
			linkItem.classList.add("link-item");

			// Link displayed above
			const anchor = document.createElement("a");
			anchor.href = link;
			anchor.textContent = link;
			anchor.target = "_blank";
			anchor.style.fontSize = "0.7rem";
			anchor.style.display = "block";
			linkItem.appendChild(anchor);

			// Container for info text and buttons in a row
			const infoContainer = document.createElement("div");
			infoContainer.classList.add("link-info-container");

			const infoText = document.createElement("div");
			infoText.textContent = info || "";
			infoText.classList.add("link-info-text");

			// Button container to keep Edit and Delete together on the right
			const buttonGroup = document.createElement("div");
			buttonGroup.classList.add("link-info-button-group");

			// Edit button
			const editBtn = document.createElement("button");
			editBtn.textContent = "Edit Info";
			editBtn.classList.add("edit-btn");
			editBtn.addEventListener("click", () => {
				const newInfo = prompt("Enter new info:", info || "");
				if (newInfo !== null) {
					myLinks[category][index].info = newInfo.trim() || "";
					saveToLocalStorage();
					linkContainer.remove();
					toggleLinks(parent, category);
				}
			});

			// Delete button
			const deleteLinkBtn = document.createElement("button");
			deleteLinkBtn.textContent = "Delete Link";
			deleteLinkBtn.classList.add("delete-link-btn");
			deleteLinkBtn.addEventListener("click", () => {
				if (confirm("Are you sure you want to delete this link?")) {
					myLinks[category].splice(index, 1);
					saveToLocalStorage();
					linkContainer.remove();
					toggleLinks(parent, category);
				}
			});

			buttonGroup.appendChild(editBtn);
			buttonGroup.appendChild(deleteLinkBtn);

			infoContainer.appendChild(infoText);
			infoContainer.appendChild(buttonGroup);

			linkItem.appendChild(infoContainer);
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
