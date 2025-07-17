/* global apiService, meact */

const [modalOpenKey, getModalOpen, setModalOpen] = meact.useState(false);
const [titleKey, getTitle, setTitle] = meact.useState("");
const [authorKey, getAuthor, setAuthor] = meact.useState("");
const [fileKey, getFile, setFile] = meact.useState(null);

const [imagesKey, getImages, setImages] = meact.useState([]);
const [currentIndexKey, getCurrentIndex, setCurrentIndex] = meact.useState(0);
const [commentPageKey, getCommentPage, setCommentPage] = meact.useState(0);
const [directionKey, getDirection, setDirection] = meact.useState(null);

const [imagePageKey, getImagePage, setImagePage] = meact.useState(0);
const [imageTotalPagesKey, getImageTotalPages, setImageTotalPages] =
  meact.useState(1);
const [imageTotalCountKey, getImageTotalCount, setImageTotalCount] =
  meact.useState(0);

const [galleryModeKey, getGalleryMode, setGalleryMode] = meact.useState("all");

function showLoading() {
  document.getElementById("loading-overlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.add("hidden");
}

function updateGalleryButtonStyles() {
  const mode = getGalleryMode();
  const allBtn = document.getElementById("all-gallery-button");
  const myBtn = document.getElementById("my-gallery-button");

  allBtn.classList.toggle("active", mode === "all");
  myBtn.classList.toggle("active", mode === "mine");

  allBtn.disabled = mode === "all";
  myBtn.disabled = mode === "mine";
}

function setGalleryAll() {
  setGalleryMode("all");
  loadImages(0);
  updateGalleryButtonStyles();
  updateImageActionButtonsVisibility();
}

function setGalleryMine() {
  setGalleryMode("mine");
  loadImages(0);
  updateGalleryButtonStyles();
  updateImageActionButtonsVisibility();
}

function loadImages(page = 0) {
  showLoading();
  const mode = getGalleryMode();
  apiService.getImages(page, 10, mode).then(function (data) {
    setImages(data.images);
    setImagePage(data.page);
    setImageTotalPages(data.totalPages);
    setImageTotalCount(data.total);
    setCurrentIndex(0);
    updateImageActionButtonsVisibility();
    hideLoading();
  });
}

function updateCommentControlsVisibility() {
  const commentControls = document.getElementById("comment-controls-container");
  if (!commentControls) return;

  if (apiService.isAuthenticated()) {
    commentControls.classList.remove("hidden");
  } else {
    commentControls.classList.add("hidden");
  }
}

function updateImageActionButtonsVisibility() {
  const addBtn = document.querySelector(".add-button");
  const deleteBtn = document.querySelector(".delete-button");

  const isAuthenticated = apiService.isAuthenticated();
  const isMyGallery = getGalleryMode() === "mine";

  if (addBtn) {
    addBtn.classList.toggle("hidden", !(isAuthenticated && isMyGallery));
  }

  if (deleteBtn) {
    deleteBtn.classList.toggle("hidden", !(isAuthenticated && isMyGallery));
  }
}

function getCurrentImage() {
  const imgs = getImages();
  return imgs[getCurrentIndex()] || null;
}

function renderImage(direction) {
  const imageEl = document.getElementById("carousel-image");
  const container = document.querySelector(".carousel-image-container");
  const indexDisplay = document.getElementById("image-index");
  const titleElem = document.getElementById("image-title-display");
  const authorElem = document.getElementById("image-author-display");

  const currentImage = getCurrentImage();
  if (!currentImage) {
    imageEl.style.display = "none";
    document.getElementById("no-images-message").classList.remove("hidden");
    indexDisplay.textContent = `0 / 0`;
    titleElem.textContent = "No title";
    authorElem.textContent = "Unknown";
    document.getElementById("comment-list").innerHTML = "";
    document.getElementById("comment-controls-container").classList.add("hidden");
    return;
  } else {
    imageEl.style.display = "block";
    document.getElementById("no-images-message").classList.add("hidden");
  }

  const applyImage = function () {
    imageEl.src = currentImage.url;
    const globalIndex = getImagePage() * 10 + getCurrentIndex() + 1;
    indexDisplay.textContent = `${globalIndex} / ${getImageTotalCount()}`;
    titleElem.textContent = currentImage.title;
    authorElem.textContent = currentImage.author;

    updateImageActionButtonsVisibility();
  };

  if (direction === "next" || direction === "prev") {
    container.classList.add(
      `fade-out-${direction === "next" ? "left" : "right"}`
    );
    setTimeout(function () {
      applyImage();
      container.classList.remove(
        `fade-out-${direction === "next" ? "left" : "right"}`
      );
      container.classList.add(
        `fade-in-${direction === "next" ? "right" : "left"}`
      );
      setTimeout(
        () =>
          container.classList.remove(
            `fade-in-${direction === "next" ? "right" : "left"}`
          ),
        400
      );
    }, 400);
  } else {
    applyImage();
  }
}

meact.useEffect(() => {
  renderImage(getDirection());
  setDirection(null);
}, [currentIndexKey]);

meact.useEffect(renderComments, [commentPageKey, currentIndexKey]);

function prevImage() {
  const index = getCurrentIndex();
  if (index > 0) {
    setDirection("prev");
    setCurrentIndex(index - 1);
  } else if (getImagePage() > 0) {
    const prevPage = getImagePage() - 1;
    showLoading();
    apiService.getImages(prevPage, 10, getGalleryMode()).then(function (data) {
      setImages(data.images);
      setImagePage(data.page);
      setImageTotalPages(data.totalPages);
      setCurrentIndex(data.images.length - 1);
      setDirection("prev");
      hideLoading();
    });
  }
}

function nextImage() {
  const index = getCurrentIndex();
  const images = getImages();
  const isLastImageOnPage = index >= images.length - 1;

  if (!isLastImageOnPage) {
    setDirection("next");
    setCurrentIndex(index + 1);
  } else if (getImagePage() < getImageTotalPages() - 1) {
    const nextPage = getImagePage() + 1;
    showLoading();
    apiService.getImages(nextPage, 10, getGalleryMode()).then(function (data) {
      setImages(data.images);
      setImagePage(data.page);
      setImageTotalPages(data.totalPages);
      setCurrentIndex(0);
      setDirection("next");
      hideLoading();
    });
  }
}

function prevImagePage() {
  if (getImagePage() > 0) {
    loadImages(getImagePage() - 1);
  }
}

function nextImagePage() {
  if (getImagePage() < getImageTotalPages() - 1) {
    loadImages(getImagePage() + 1);
  }
}

function deleteImage() {
  const image = getCurrentImage();
  if (!image) return;

  showLoading();
  apiService.deleteImage(image.id).then(function () {
    loadImages(getImagePage());
  });
}

function openAddImageModal() {
  setModalOpen(true);
}

function closeAddImageModal() {
  setModalOpen(false);

  setFile(null);

  const fileInput = document.getElementById("image-url");
  const fileNameDisplay = document.getElementById("file-name-display");
  const fileInputWrapper = document.getElementById("file-input-wrapper");

  if (fileInput) fileInput.value = "";
  if (fileNameDisplay) fileNameDisplay.textContent = "";
  if (fileInputWrapper) fileInputWrapper.style.display = "block";
}

function submitNewImage() {
  const title = getTitle().trim();
  const author = getAuthor().trim();
  const file = getFile();

  if (!file) {
    alert("Select an image file.");
    return;
  }

  showLoading();
  apiService.addImage(title, author, file).then(function () {
    setTitle("");
    setAuthor("");
    setFile(null);
    document.getElementById("file-name-display").textContent = "";
    document.getElementById("file-input-wrapper").style.display = "block";
    closeAddImageModal();
    loadImages(getImagePage());
  });
}

function addComment(event) {
  event.preventDefault();
  const content = document.getElementById("comment-text").value.trim();
  if (!content) return;

  const image = getCurrentImage();
  if (!image) {
    alert("No images available to comment on.");
    return;
  }
  showLoading();
  apiService.addComment(String(image.id), content).then(function () {
    document.getElementById("comment-text").value = "";
    setCommentPage(0);
    hideLoading();
  });
}

function renderComments() {
  const image = getCurrentImage();
  const commentList = document.getElementById("comment-list");
  updateCommentControlsVisibility();
  commentList.innerHTML = "";
  if (!image) return;

  showLoading();
  apiService.getComments(image.id, getCommentPage()).then(function (comments) {
    if (!comments || !Array.isArray(comments)) {
      commentList.innerHTML =
        "<li>You must be logged in to view comments.</li>";
      hideLoading();
      return;
    }

    if (comments.length === 0) {
      const empty = document.createElement("li");
      empty.style.color = "#777";

      if (!apiService.isAuthenticated()) {
        empty.textContent = "Login to see comments.";
      } else {
        empty.textContent = "No comments yet.";
      }

      commentList.appendChild(empty);
      hideLoading();
      return;
    }

    apiService.getCurrentUser().then((currentUser) => {
      comments.forEach(function (comment) {
        const li = document.createElement("li");

        const header = document.createElement("div");
        header.className = "comment-header";
        header.textContent = comment.author;

        const date = document.createElement("div");
        date.className = "comment-date";
        date.textContent = new Date(comment.createdAt).toLocaleString();

        const text = document.createElement("div");
        text.className = "comment-text";
        text.textContent = comment.content;

        li.appendChild(header);
        li.appendChild(date);
        li.appendChild(text);

        const isCommentOwner =
          currentUser && comment.author === currentUser.username;
        const isGalleryOwner =
          currentUser && getCurrentImage()?.userId === currentUser.id;

        if (isCommentOwner || isGalleryOwner) {
          const del = document.createElement("button");
          del.textContent = "Delete";
          del.className = "delete-comment-button";
          del.onclick = function () {
            showLoading();
            apiService.deleteComment(comment.id).then(function () {
              renderComments();
            });
          };
          li.appendChild(del);
        }

        commentList.appendChild(li);
      });

      hideLoading();
    });
  });
}

function prevCommentPage() {
  if (getCommentPage() > 0) setCommentPage(getCommentPage() - 1);
}

function nextCommentPage() {
  const image = getCurrentImage();
  if (!image) return;

  apiService
    .getComments(image.id, getCommentPage() + 1)
    .then(function (nextComments) {
      if (nextComments.length > 0) {
        setCommentPage(getCommentPage() + 1);
      }
    });
}

function goToLogin() {
  window.location.href = "/login.html";
}

function handleLogout() {
  apiService.logout(false);
  window.location.href = "/index.html";
}

meact.useEffect(() => {
  const modal = document.getElementById("add-image-modal");
  if (getModalOpen()) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}, [modalOpenKey]);

meact.useEffect(() => {
  document.getElementById("image-title").value = getTitle();
}, [titleKey]);

meact.useEffect(() => {
  document.getElementById("image-author").value = getAuthor();
}, [authorKey]);

meact.useEffect(() => {
  document.getElementById("image-url").value = "";
}, [fileKey]);

meact.useEffect(() => {
  const indicator = document.getElementById("image-page-indicator");
  if (indicator) {
    indicator.textContent = `Page ${getImagePage() + 1}`;
  }
}, [imagePageKey]);

document.addEventListener("input", function (e) {
  if (e.target.id === "image-title") setTitle(e.target.value);
  if (e.target.id === "image-author") setAuthor(e.target.value);
  if (e.target.id === "image-url") {
    const file = e.target.files[0];
    setFile(file);

    const fileNameDisplay = document.getElementById("file-name-display");
    const fileInputWrapper = document.getElementById("file-input-wrapper");

    if (file) {
      fileNameDisplay.textContent = file.name;
      fileInputWrapper.style.display = "none"; // 🔒 Hide file input
    } else {
      fileNameDisplay.textContent = "";
      fileInputWrapper.style.display = "block"; // 🔓 Show if cleared
    }
  }
});

window.prevImage = prevImage;
window.nextImage = nextImage;
window.prevImagePage = prevImagePage;
window.nextImagePage = nextImagePage;
window.deleteImage = deleteImage;
window.openAddImageModal = openAddImageModal;
window.closeAddImageModal = closeAddImageModal;
window.submitNewImage = submitNewImage;
window.addComment = addComment;
window.prevCommentPage = prevCommentPage;
window.nextCommentPage = nextCommentPage;
window.goToLogin = goToLogin;
window.handleLogout = handleLogout;
window.setGalleryAll = setGalleryAll;
window.setGalleryMine = setGalleryMine;
window.updateGalleryButtonStyles = updateGalleryButtonStyles;

window.addEventListener("load", function () {
  const loginBtn = document.getElementById("login-button");
  const logoutBtn = document.getElementById("logout-button");
  const myGalleryBtn = document.getElementById("my-gallery-button");

  if (apiService.isAuthenticated()) {
    logoutBtn.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    myGalleryBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    myGalleryBtn.classList.add("hidden");
  }

  updateGalleryButtonStyles();

  updateCommentControlsVisibility();

  loadImages();
});
